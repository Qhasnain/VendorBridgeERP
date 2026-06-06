import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export async function getAllRfqs(req: AuthenticatedRequest, res: Response) {
  const { search, status } = req.query;
  const user = req.user;

  try {
    const whereClause: any = {};

    if (status) {
      whereClause.status = String(status);
    }

    if (search) {
      whereClause.OR = [
        { rfqNumber: { contains: String(search) } },
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    // Role-based RFQ Visibility
    if (user?.role === 'VENDOR') {
      // Find vendor ID mapped to the user
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
      });

      if (!vendor) {
        return res.json([]); // No vendor profile = no RFQs
      }

      // Restrict to RFQs assigned to this vendor and not in DRAFT
      whereClause.assignedVendors = {
        some: {
          vendorId: vendor.id,
        },
      };
      whereClause.status = {
        not: 'DRAFT',
      };
    }

    const rfqs = await prisma.rfq.findMany({
      where: whereClause,
      include: {
        assignedVendors: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                vendorId: true,
              },
            },
          },
        },
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(rfqs);
  } catch (error: any) {
    console.error('Failed to get RFQs:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getRfqById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const user = req.user;

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignedVendors: {
          include: {
            vendor: true,
          },
        },
        createdBy: {
          select: { name: true, email: true },
        },
        quotations: {
          include: {
            vendor: true,
          },
        },
        approvals: {
          include: {
            approver: { select: { name: true } },
          },
        },
        pos: true,
      },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    // Authorization check for Vendor role
    if (user?.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
      });
      const isAssigned = rfq.assignedVendors.some(av => av.vendorId === vendor?.id);
      if (!isAssigned || rfq.status === 'DRAFT') {
        return res.status(403).json({ error: 'Forbidden: You are not assigned to this RFQ' });
      }
    }

    return res.json(rfq);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createRfq(req: AuthenticatedRequest, res: Response) {
  const { title, description, productDetails, budget, deadline, assignedVendorIds } = req.body;

  if (!title || !productDetails || !budget || !deadline) {
    return res.status(400).json({ error: 'Title, product details, budget, and deadline are required' });
  }

  try {
    const currentYear = new Date().getFullYear();
    const rfqCount = await prisma.rfq.count();
    const rfqNumber = `RFQ-${currentYear}-${String(rfqCount + 1).padStart(6, '0')}`;

    // productDetails should be stringified JSON on create if it comes as an array/object
    const productDetailsStr = typeof productDetails === 'string' 
      ? productDetails 
      : JSON.stringify(productDetails);

    const rfq = await prisma.rfq.create({
      data: {
        rfqNumber,
        title,
        description: description || '',
        productDetails: productDetailsStr,
        budget: parseFloat(budget),
        deadline: new Date(deadline),
        createdById: req.user!.id,
        status: 'DRAFT', // Starts as draft
      },
    });

    // Handle vendor assignments if provided
    if (assignedVendorIds && Array.isArray(assignedVendorIds)) {
      const assignments = assignedVendorIds.map((vId: number) => ({
        rfqId: rfq.id,
        vendorId: vId,
      }));
      await prisma.rfqVendor.createMany({ data: assignments });

      // Create in-app notifications for each assigned vendor
      for (const vId of assignedVendorIds) {
        const v = await prisma.vendor.findUnique({ where: { id: vId } });
        if (v?.userId) {
          await prisma.notification.create({
            data: {
              userId: v.userId,
              message: `You have been assigned to RFQ ${rfqNumber}: "${title}". Click to submit your quote.`,
              type: 'RFQ_ASSIGNED',
            },
          });
        }
      }
    }

    await createAuditLog(
      req.user!.id,
      'RFQ_CREATION',
      `Created RFQ ${rfqNumber} with budget ${budget} INR`,
      req.ip
    );

    return res.status(201).json(rfq);
  } catch (error: any) {
    console.error('Create RFQ error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function updateRfq(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { title, description, productDetails, budget, deadline, status, assignedVendorIds } = req.body;

  try {
    const rfqId = parseInt(id);
    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    // Lock updates if already approved/completed unless it is simple status override
    const productDetailsStr = productDetails 
      ? (typeof productDetails === 'string' ? productDetails : JSON.stringify(productDetails))
      : undefined;

    const updated = await prisma.rfq.update({
      where: { id: rfqId },
      data: {
        title,
        description,
        productDetails: productDetailsStr,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
      },
    });

    if (assignedVendorIds && Array.isArray(assignedVendorIds)) {
      // Re-assign vendors (clear old and insert new)
      await prisma.rfqVendor.deleteMany({ where: { rfqId } });
      const assignments = assignedVendorIds.map((vId: number) => ({
        rfqId,
        vendorId: vId,
      }));
      await prisma.rfqVendor.createMany({ data: assignments });
    }

    // Trigger notification if RFQ is submitted (from Draft to Submitted)
    if (status === 'SUBMITTED' && rfq.status === 'DRAFT') {
      // Notify assigned vendors
      const assignments = await prisma.rfqVendor.findMany({
        where: { rfqId },
        include: { vendor: true },
      });
      for (const assign of assignments) {
        if (assign.vendor.userId) {
          await prisma.notification.create({
            data: {
              userId: assign.vendor.userId,
              message: `RFQ ${rfq.rfqNumber} has been officially released. Deadline: ${new Date(rfq.deadline).toLocaleDateString()}`,
              type: 'RFQ_ASSIGNED',
            },
          });
        }
      }
    }

    await createAuditLog(
      req.user!.id,
      'RFQ_UPDATE',
      `Updated RFQ ${rfq.rfqNumber}. Status set to: ${status || rfq.status}`,
      req.ip
    );

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteRfq(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const rfq = await prisma.rfq.findUnique({ where: { id: parseInt(id) } });
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    await prisma.rfq.delete({ where: { id: parseInt(id) } });

    await createAuditLog(
      req.user!.id,
      'RFQ_DELETE',
      `Deleted RFQ ${rfq.rfqNumber}`,
      req.ip
    );

    return res.json({ message: 'RFQ deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

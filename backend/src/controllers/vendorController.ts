import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export async function getAllVendors(req: AuthenticatedRequest, res: Response) {
  const { search, category, status } = req.query;

  try {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { companyName: { contains: String(search) } },
        { contactPerson: { contains: String(search) } },
        { email: { contains: String(search) } },
        { vendorId: { contains: String(search) } },
      ];
    }

    if (category) {
      whereClause.category = String(category);
    }

    if (status) {
      whereClause.status = String(status);
    }

    const vendors = await prisma.vendor.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(vendors);
  } catch (error: any) {
    console.error('Failed to get vendors:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getVendorById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { name: true, email: true },
        },
        quotations: {
          include: {
            rfq: true,
          },
        },
        pos: true,
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    return res.json(vendor);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createVendor(req: AuthenticatedRequest, res: Response) {
  const { companyName, category, gstNumber, panNumber, contactPerson, email, phone, address } = req.body;

  if (!companyName || !gstNumber || !panNumber || !email || !phone || !address) {
    return res.status(400).json({ error: 'Required vendor parameters are missing.' });
  }

  try {
    const existing = await prisma.vendor.findFirst({
      where: {
        OR: [{ gstNumber }, { panNumber }, { email }],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'A vendor with this GST, PAN, or Email already exists.' });
    }

    const count = await prisma.vendor.count();
    const vendorId = `VEND-${String(count + 1).padStart(6, '0')}`;

    const vendor = await prisma.vendor.create({
      data: {
        vendorId,
        companyName,
        category: category || 'General Solutions',
        gstNumber,
        panNumber,
        contactPerson,
        email,
        phone,
        address,
        status: 'APPROVED', // Direct creation by officer/admin starts approved
      },
    });

    await createAuditLog(
      req.user?.id || null,
      'VENDOR_CREATION',
      `Directly created Vendor profile ${companyName} (${vendorId})`,
      req.ip
    );

    return res.status(201).json(vendor);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateVendor(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { companyName, category, gstNumber, panNumber, contactPerson, email, phone, address, status, rating } = req.body;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const updated = await prisma.vendor.update({
      where: { id: parseInt(id) },
      data: {
        companyName,
        category,
        gstNumber,
        panNumber,
        contactPerson,
        email,
        phone,
        address,
        status,
        rating: rating !== undefined ? parseFloat(rating) : undefined,
      },
    });

    await createAuditLog(
      req.user?.id || null,
      'VENDOR_UPDATE',
      `Updated Vendor profile ${vendor.companyName} (${vendor.vendorId}). Status: ${status || vendor.status}`,
      req.ip
    );

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteVendor(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    await prisma.vendor.delete({
      where: { id: parseInt(id) },
    });

    await createAuditLog(
      req.user?.id || null,
      'VENDOR_DELETE',
      `Deleted Vendor profile ${vendor.companyName} (${vendor.vendorId})`,
      req.ip
    );

    return res.json({ message: 'Vendor profile successfully deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export async function createPurchaseOrder(req: AuthenticatedRequest, res: Response) {
  const { rfqId } = req.body;

  if (!rfqId) {
    return res.status(400).json({ error: 'RFQ ID is required' });
  }

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: parseInt(rfqId) },
      include: {
        quotations: {
          where: { status: 'ACCEPTED' },
          include: { vendor: true },
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    if (rfq.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Purchase Order can only be generated for APPROVED RFQs' });
    }

    const acceptedQuote = rfq.quotations[0];
    if (!acceptedQuote) {
      return res.status(400).json({ error: 'No approved/accepted quotation found for this RFQ' });
    }

    const currentYear = new Date().getFullYear();
    const poCount = await prisma.purchaseOrder.count();
    const poNumber = `PO-${currentYear}-${String(poCount + 1).padStart(6, '0')}`;

    const totalAmount = acceptedQuote.price + acceptedQuote.taxes;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        rfqId: rfq.id,
        vendorId: acceptedQuote.vendorId,
        approvedQuoteId: acceptedQuote.id,
        totalAmount,
        tax: acceptedQuote.taxes,
        status: 'SENT',
        createdById: req.user!.id,
      },
    });

    // Update RFQ status to PO_GENERATED
    await prisma.rfq.update({
      where: { id: rfq.id },
      data: { status: 'PO_GENERATED' },
    });

    // Notify vendor
    if (acceptedQuote.vendor.userId) {
      await prisma.notification.create({
        data: {
          userId: acceptedQuote.vendor.userId,
          message: `A new Purchase Order ${poNumber} has been issued to you. Please review and accept.`,
          type: 'RFQ_APPROVED',
        },
      });
    }

    await createAuditLog(
      req.user!.id,
      'PO_GENERATION',
      `Generated Purchase Order ${poNumber} for vendor ${acceptedQuote.vendor.companyName}`,
      req.ip
    );

    return res.status(201).json(po);
  } catch (error: any) {
    console.error('PO creation error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getAllPos(req: AuthenticatedRequest, res: Response) {
  const user = req.user;

  try {
    const whereClause: any = {};

    if (user?.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
      });
      if (!vendor) return res.json([]);
      whereClause.vendorId = vendor.id;
    }

    const pos = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        rfq: true,
        vendor: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(pos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getPoById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const user = req.user;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        rfq: true,
        vendor: true,
        approvedQuote: true,
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    // Auth check
    if (user?.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: user.id } });
      if (po.vendorId !== vendor?.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    return res.json(po);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updatePoStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body; // ACCEPTED, COMPLETED, CANCELLED

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(id) },
      include: { vendor: true },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { status },
    });

    // Notify relevant parties
    if (status === 'ACCEPTED') {
      await prisma.notification.create({
        data: {
          userId: po.createdById,
          message: `Purchase Order ${po.poNumber} was ACCEPTED by vendor ${po.vendor.companyName}. Ready for invoicing.`,
          type: 'RFQ_APPROVED',
        },
      });
    }

    await createAuditLog(
      req.user!.id,
      'PO_UPDATE',
      `Set status of Purchase Order ${po.poNumber} to ${status}`,
      req.ip
    );

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

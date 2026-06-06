import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export async function submitForReview(req: AuthenticatedRequest, res: Response) {
  const { rfqId } = req.body;

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: parseInt(rfqId) },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    if (rfq.status !== 'DRAFT' && rfq.status !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Only Draft or Submitted RFQs can be put under review' });
    }

    const updated = await prisma.rfq.update({
      where: { id: rfq.id },
      data: { status: 'UNDER_REVIEW' },
    });

    // Notify managers
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
    });

    for (const mgr of managers) {
      await prisma.notification.create({
        data: {
          userId: mgr.id,
          message: `RFQ ${rfq.rfqNumber} has been submitted for approval review.`,
          type: 'APPROVAL_PENDING',
        },
      });
    }

    await createAuditLog(
      req.user!.id,
      'APPROVAL_ACTION',
      `Submitted RFQ ${rfq.rfqNumber} for Manager review`,
      req.ip
    );

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function processApproval(req: AuthenticatedRequest, res: Response) {
  const { rfqId, status, remarks, acceptedQuoteId } = req.body;
  const user = req.user;

  if (!rfqId || !status || !remarks) {
    return res.status(400).json({ error: 'RFQ ID, status (APPROVED/REJECTED), and remarks are required' });
  }

  if (status === 'APPROVED' && !acceptedQuoteId) {
    return res.status(400).json({ error: 'Must accept a specific quotation to approve the RFQ' });
  }

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: parseInt(rfqId) },
      include: { quotations: true },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const approval = await prisma.approval.create({
      data: {
        rfqId: rfq.id,
        status,
        remarks,
        approverId: user!.id,
      },
    });

    const newRfqStatus = status === 'APPROVED' ? 'APPROVED' : 'DRAFT'; // Reject puts back into draft/re-evaluate

    // Update RFQ status
    await prisma.rfq.update({
      where: { id: rfq.id },
      data: { status: newRfqStatus },
    });

    if (status === 'APPROVED' && acceptedQuoteId) {
      // Mark selected quotation as ACCEPTED, others as REJECTED
      await prisma.quotation.updateMany({
        where: { rfqId: rfq.id },
        data: { status: 'REJECTED' },
      });

      await prisma.quotation.update({
        where: { id: parseInt(acceptedQuoteId) },
        data: { status: 'ACCEPTED' },
      });

      const selectedQuote = await prisma.quotation.findUnique({
        where: { id: parseInt(acceptedQuoteId) },
        include: { vendor: true },
      });

      // Notify Vendor of acceptance
      if (selectedQuote?.vendor.userId) {
        await prisma.notification.create({
          data: {
            userId: selectedQuote.vendor.userId,
            message: `Congratulations! Your quotation for RFQ ${rfq.rfqNumber} has been APPROVED. Purchase Order is being generated.`,
            type: 'RFQ_APPROVED',
          },
        });
      }

      // Notify Procurement Officer who created the RFQ
      await prisma.notification.create({
        data: {
          userId: rfq.createdById,
          message: `RFQ ${rfq.rfqNumber} has been approved by ${user!.name}. Unlock PO Generation.`,
          type: 'RFQ_APPROVED',
        },
      });
    }

    await createAuditLog(
      user!.id,
      'APPROVAL_ACTION',
      `${status} RFQ ${rfq.rfqNumber}. Remarks: ${remarks}`,
      req.ip
    );

    return res.json({ approval, rfqStatus: newRfqStatus });
  } catch (error: any) {
    console.error('Approval execution error:', error);
    return res.status(500).json({ error: error.message });
  }
}

import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export async function submitQuotation(req: AuthenticatedRequest, res: Response) {
  const { rfqId, price, taxes, deliveryTimeline, notes, attachments } = req.body;
  const user = req.user;

  if (!rfqId || price === undefined || taxes === undefined || !deliveryTimeline) {
    return res.status(400).json({ error: 'RFQ ID, price, taxes, and delivery timeline are required' });
  }

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user!.id },
    });

    if (!vendor) {
      return res.status(403).json({ error: 'Only registered vendors can submit quotations' });
    }

    if (vendor.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Your vendor profile must be APPROVED to submit quotations' });
    }

    const rfq = await prisma.rfq.findUnique({
      where: { id: parseInt(rfqId) },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    // Check RFQ deadline
    if (new Date() > new Date(rfq.deadline)) {
      return res.status(400).json({ error: 'Quotation submission deadline has passed' });
    }

    const attachmentsStr = attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : '[]';

    // Upsert quotation (vendors can submit once and edit before deadline)
    const quote = await prisma.quotation.upsert({
      where: {
        rfqId_vendorId: {
          rfqId: rfq.id,
          vendorId: vendor.id,
        },
      },
      create: {
        rfqId: rfq.id,
        vendorId: vendor.id,
        price: parseFloat(price),
        taxes: parseFloat(taxes),
        deliveryTimeline: parseInt(deliveryTimeline),
        notes,
        attachments: attachmentsStr,
        status: 'SUBMITTED',
      },
      update: {
        price: parseFloat(price),
        taxes: parseFloat(taxes),
        deliveryTimeline: parseInt(deliveryTimeline),
        notes,
        attachments: attachmentsStr,
        status: 'SUBMITTED',
      },
    });

    // Notify procurement officers of the submission
    await prisma.notification.create({
      data: {
        userId: rfq.createdById,
        message: `Vendor ${vendor.companyName} has submitted a quotation for ${rfq.rfqNumber}.`,
        type: 'QUOTATION_SUBMITTED',
      },
    });

    await createAuditLog(
      user!.id,
      'QUOTATION_SUBMITTING',
      `Submitted quotation for RFQ ${rfq.rfqNumber}. Total Price: ${price} INR`,
      req.ip
    );

    return res.status(201).json(quote);
  } catch (error: any) {
    console.error('Quotation submit error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getQuotationsByRfq(req: AuthenticatedRequest, res: Response) {
  const { rfqId } = req.params;

  try {
    const quotes = await prisma.quotation.findMany({
      where: { rfqId: parseInt(rfqId) },
      include: { vendor: true },
    });
    return res.json(quotes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getComparisonMatrix(req: AuthenticatedRequest, res: Response) {
  const { rfqId } = req.params;

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: parseInt(rfqId) },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    const quotations = await prisma.quotation.findMany({
      where: { rfqId: parseInt(rfqId) },
      include: { vendor: true },
    });

    if (quotations.length === 0) {
      return res.json({ rfq, comparisons: [] });
    }

    // Find minimum price and fastest delivery to normalize values
    const minPrice = Math.min(...quotations.map(q => q.price));
    const minDelivery = Math.min(...quotations.map(q => q.deliveryTimeline));

    const comparisons = quotations.map(q => {
      // 40% Price Score (Lowest Price / Quote Price)
      const priceScore = q.price > 0 ? (minPrice / q.price) * 100 : 0;

      // 30% Vendor Rating (Rating / 5.0)
      const ratingScore = (q.vendor.rating / 5.0) * 100;

      // 20% Delivery Score (Fastest Delivery / Quote Delivery)
      const deliveryScore = q.deliveryTimeline > 0 ? (minDelivery / q.deliveryTimeline) * 100 : 0;

      // 10% Historical Score (derived from rating or set to default 80 if new)
      const historicalScore = q.vendor.rating > 0 ? (q.vendor.rating / 5.0) * 100 : 80;

      // Weighted Calculation
      const totalScore = (priceScore * 0.4) + (ratingScore * 0.3) + (deliveryScore * 0.2) + (historicalScore * 0.1);

      return {
        id: q.id,
        vendorId: q.vendorId,
        companyName: q.vendor.companyName,
        vendorRating: q.vendor.rating,
        price: q.price,
        taxes: q.taxes,
        deliveryTimeline: q.deliveryTimeline,
        notes: q.notes,
        status: q.status,
        scores: {
          price: Math.round(priceScore * 10) / 10,
          rating: Math.round(ratingScore * 10) / 10,
          delivery: Math.round(deliveryScore * 10) / 10,
          history: Math.round(historicalScore * 10) / 10,
          total: Math.round(totalScore * 10) / 10,
        },
        isRecommended: false,
      };
    });

    // Sort comparisons by total score descending
    comparisons.sort((a, b) => b.scores.total - a.scores.total);

    // Mark the top one as recommended
    if (comparisons.length > 0) {
      comparisons[0].isRecommended = true;
    }

    return res.json({
      rfq,
      comparisons,
    });
  } catch (error: any) {
    console.error('Failed to calculate comparison matrix:', error);
    return res.status(500).json({ error: error.message });
  }
}

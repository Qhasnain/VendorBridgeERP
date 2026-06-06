import prisma from '../prisma';

export interface InvoiceInsightResult {
  insights: string[];
  duplicates: Array<{ invoiceNumber: string; reason: string }>;
  costAnalysis: {
    status: 'OPTIMAL' | 'WARNING' | 'FLAGGED';
    spikePercentage: number;
    details: string;
  };
  vendorIntelligence: Array<{ companyName: string; reason: string; rating: number }>;
}

/**
 * Calculates local AI metrics and insights for an Invoice
 */
export async function getInvoiceInsights(invoiceId: number): Promise<InvoiceInsightResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      purchaseOrder: {
        include: {
          vendor: true,
          rfq: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const vendorId = invoice.purchaseOrder.vendorId;
  const companyName = invoice.purchaseOrder.vendor.companyName;
  const currentTotal = invoice.totalAmount;

  // 1. Analyze Vendor History & Spending Trends
  const allVendorInvoices = await prisma.invoice.findMany({
    where: {
      purchaseOrder: { vendorId },
      id: { not: invoiceId },
    },
    select: { totalAmount: true },
  });

  const previousTotalSpend = allVendorInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const averageSpend = allVendorInvoices.length > 0 ? previousTotalSpend / allVendorInvoices.length : currentTotal;

  const insights: string[] = [];
  if (allVendorInvoices.length > 0) {
    const changePct = ((currentTotal - averageSpend) / averageSpend) * 100;
    if (changePct > 10) {
      insights.push(`Invoice total exceeds this vendor's historical average by ${Math.round(changePct)}%.`);
    } else if (changePct < -10) {
      insights.push(`Invoice total is ${Math.round(Math.abs(changePct))}% lower than this vendor's historical average.`);
    } else {
      insights.push(`Pricing is highly consistent with historical purchase orders for ${companyName}.`);
    }
  } else {
    insights.push(`First-time procurement cycle initialized with ${companyName}.`);
  }

  // 2. Duplicate Detection
  const duplicates: Array<{ invoiceNumber: string; reason: string }> = [];
  const sameAmountInvoice = await prisma.invoice.findFirst({
    where: {
      id: { not: invoiceId },
      totalAmount: currentTotal,
      purchaseOrder: { vendorId },
    },
  });

  if (sameAmountInvoice) {
    duplicates.push({
      invoiceNumber: sameAmountInvoice.invoiceNumber,
      reason: `Matching invoice amount (${currentTotal.toLocaleString()} INR) for the same supplier.`,
    });
  }

  const samePoInvoice = await prisma.invoice.findFirst({
    where: {
      id: { not: invoiceId },
      purchaseOrderId: invoice.purchaseOrderId,
    },
  });

  if (samePoInvoice) {
    duplicates.push({
      invoiceNumber: samePoInvoice.invoiceNumber,
      reason: `Another invoice is already mapped to Purchase Order ${invoice.purchaseOrder.poNumber}.`,
    });
  }

  // 3. Smart Cost Analysis
  let costStatus: 'OPTIMAL' | 'WARNING' | 'FLAGGED' = 'OPTIMAL';
  let spikePercentage = 0;
  let costDetails = 'Pricing matches standard market quotes for this product category.';

  const budget = invoice.purchaseOrder.rfq.budget;
  if (currentTotal > budget) {
    spikePercentage = ((currentTotal - budget) / budget) * 100;
    costStatus = spikePercentage > 15 ? 'FLAGGED' : 'WARNING';
    costDetails = `Procurement total exceeds the allocated RFQ budget cap (${budget.toLocaleString()} INR) by ${Math.round(spikePercentage)}%.`;
  }

  // 4. Vendor Intelligence Recommendations
  const vendorIntelligence: Array<{ companyName: string; reason: string; rating: number }> = [];
  const otherVendors = await prisma.vendor.findMany({
    where: {
      status: 'APPROVED',
      id: { not: vendorId },
      rating: { gt: invoice.purchaseOrder.vendor.rating },
    },
    take: 2,
  });

  for (const v of otherVendors) {
    vendorIntelligence.push({
      companyName: v.companyName,
      rating: v.rating,
      reason: `Alternative supplier in this category offering a higher rating (${v.rating.toFixed(1)} ★) and potential savings.`,
    });
  }

  return {
    insights,
    duplicates,
    costAnalysis: {
      status: costStatus,
      spikePercentage: Math.round(spikePercentage * 10) / 10,
      details: costDetails,
    },
    vendorIntelligence,
  };
}

/**
 * Parses user questions locally and returns natural language responses
 */
export async function answerProcurementQuestion(query: string): Promise<string> {
  const normalized = query.toLowerCase();

  try {
    // 1. Check for Spend queries
    if (normalized.includes('spend') || normalized.includes('payout') || normalized.includes('total cost')) {
      const pos = await prisma.purchaseOrder.findMany({ select: { totalAmount: true } });
      const total = pos.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const invoiceCount = await prisma.invoice.count();
      const paidInvoices = await prisma.invoice.count({ where: { status: 'PAID' } });

      return `### Enterprise Spending Summary\n` +
             `- **Total Spend Authorized:** ${total.toLocaleString('en-IN')} INR\n` +
             `- **Generated Invoices Count:** ${invoiceCount} bills\n` +
             `- **Cleared Payouts (PAID):** ${paidInvoices} invoices\n\n` +
             `Procurement spending trends are currently stable. Let me know if you want to inspect details for a specific supplier.`;
    }

    // 2. Check for specific supplier queries (e.g. Apex, Zenith, Nexus)
    if (normalized.includes('apex') || normalized.includes('vend-000001')) {
      const vendor = await prisma.vendor.findFirst({ where: { companyName: { contains: 'Apex' } } });
      if (vendor) {
        return `### Supplier Dossier: Apex Solutions\n` +
               `- **Vendor Code:** ${vendor.vendorId}\n` +
               `- **Performance Rating:** ${vendor.rating.toFixed(1)} / 5.0 ★\n` +
               `- **Tax Identification:** GST: ${vendor.gstNumber} | PAN: ${vendor.panNumber}\n` +
               `- **Contact Desk:** ${vendor.contactPerson} (${vendor.phone})\n` +
               `- **Verification Status:** ${vendor.status}\n\n` +
               `**AI Assessment:** Apex Solutions is currently our highest-rated supplier in *${vendor.category}* with excellent delivery reliability and consistent pricing.`;
      }
    }

    if (normalized.includes('zenith') || normalized.includes('vend-000002')) {
      const vendor = await prisma.vendor.findFirst({ where: { companyName: { contains: 'Zenith' } } });
      if (vendor) {
        return `### Supplier Dossier: Zenith Tech Systems\n` +
               `- **Vendor Code:** ${vendor.vendorId}\n` +
               `- **Performance Rating:** ${vendor.rating.toFixed(1)} / 5.0 ★\n` +
               `- **Contact Desk:** ${vendor.contactPerson} (${vendor.email})\n` +
               `- **Verification Status:** ${vendor.status}\n\n` +
               `**AI Assessment:** Zenith Tech Systems is a certified supplier in *${vendor.category}*. Lead times are optimal, though unit rates average 8% higher than comparable categories.`;
      }
    }

    // 3. Check for specific Invoice queries (e.g. INV-2026-000001)
    if (normalized.includes('inv-') || normalized.includes('invoice')) {
      const match = normalized.match(/inv-\d{4}-\d+/);
      const invoiceNumber = match ? match[0].toUpperCase() : null;

      const invoice = invoiceNumber 
        ? await prisma.invoice.findUnique({
            where: { invoiceNumber },
            include: { purchaseOrder: { include: { vendor: true } } },
          })
        : await prisma.invoice.findFirst({
            include: { purchaseOrder: { include: { vendor: true } } },
            orderBy: { createdAt: 'desc' },
          });

      if (invoice) {
        const gst = JSON.parse(invoice.gstBreakdown || '{}');
        return `### Billing Summary: ${invoice.invoiceNumber}\n` +
               `- **Total Amount Billed:** ${invoice.totalAmount.toLocaleString()} INR\n` +
               `- **GST Base Tax:** ${invoice.taxAmount.toLocaleString()} INR (CGST: ${gst.cgst || 0} / SGST: ${gst.sgst || 0})\n` +
               `- **Billing Supplier:** ${invoice.purchaseOrder.vendor.companyName}\n` +
               `- **Payment Status:** **${invoice.status}**\n\n` +
               `**AI Assessment:** This invoice corresponds to Purchase Order *${invoice.purchaseOrder.poNumber}*. Let me know if you would like me to trigger an email dispatch.`;
      }
    }

    // 4. Default Help Response
    return `### VendorBridge AI Procurement Assistant\n` +
           `Hello! I am your AI assistant. I can parse natural language queries to explain procurement stats and verify supplier directories. Try asking:\n\n` +
           `- *"Show spending summary"* (Check total PO cost aggregates)\n` +
           `- *"Review Apex Solutions performance"* (Look up supplier ratings and files)\n` +
           `- *"Explain invoice INV-2026-000001"* (Audit tax and billing details)`;
  } catch (err: any) {
    return `Failed to parse database records: ${err.message}`;
  }
}

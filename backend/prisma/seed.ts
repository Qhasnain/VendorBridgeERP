import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean DB
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rfqVendor.deleteMany({});
  await prisma.rfq.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const officerPassword = await bcrypt.hash('Officer@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const vendorPassword = await bcrypt.hash('Vendor@123', 10);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'admin',
      email: 'admin@vendorbridge.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const officer = await prisma.user.create({
    data: {
      name: 'officer',
      email: 'officer@vendorbridge.com',
      passwordHash: officerPassword,
      role: 'PROCUREMENT_OFFICER',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'manager',
      email: 'manager@vendorbridge.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
    },
  });

  const vendorUser1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Apex Solutions)',
      email: 'vendor1@vendorbridge.com',
      passwordHash: vendorPassword,
      role: 'VENDOR',
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      name: 'Elena Rostova (Zenith Tech)',
      email: 'vendor2@vendorbridge.com',
      passwordHash: vendorPassword,
      role: 'VENDOR',
    },
  });

  const vendorUser3 = await prisma.user.create({
    data: {
      name: 'Marcus Brody (Nexus Logistics)',
      email: 'vendor3@vendorbridge.com',
      passwordHash: vendorPassword,
      role: 'VENDOR',
    },
  });

  // Create Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      userId: vendorUser1.id,
      vendorId: 'VEND-000001',
      companyName: 'Apex Solutions Private Limited',
      category: 'IT Hardware & Enterprise Servers',
      gstNumber: '29AAAAA1111A1Z1',
      panNumber: 'AAAAA1111A',
      contactPerson: 'Alex Rivera',
      email: 'vendor1@vendorbridge.com',
      phone: '+91 98765 43210',
      address: 'Industrial Area Phase 2, Bangalore, India',
      status: 'APPROVED',
      rating: 4.8,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      userId: vendorUser2.id,
      vendorId: 'VEND-000002',
      companyName: 'Zenith Tech Systems',
      category: 'Cloud Services & Software Licensing',
      gstNumber: '27BBBBB2222B2Z2',
      panNumber: 'BBBBB2222B',
      contactPerson: 'Elena Rostova',
      email: 'vendor2@vendorbridge.com',
      phone: '+91 87654 32109',
      address: 'Tech Park, Hinjewadi, Pune, India',
      status: 'APPROVED',
      rating: 4.2,
    },
  });

  const vendor3 = await prisma.vendor.create({
    data: {
      userId: vendorUser3.id,
      vendorId: 'VEND-000003',
      companyName: 'Nexus Logistics & Supply',
      category: 'Office Equipment & Furniture',
      gstNumber: '19CCCCC3333C3Z3',
      panNumber: 'CCCCC3333C',
      contactPerson: 'Marcus Brody',
      email: 'vendor3@vendorbridge.com',
      phone: '+91 76543 21098',
      address: 'Salt Lake Sector V, Kolkata, India',
      status: 'APPROVED',
      rating: 3.9,
    },
  });

  // Create pending registration vendor (not mapped to user yet)
  const vendor4 = await prisma.vendor.create({
    data: {
      vendorId: 'VEND-000004',
      companyName: 'Starlight Office Essentials',
      category: 'Office Equipment & Furniture',
      gstNumber: '33DDDDD4444D4Z4',
      panNumber: 'DDDDD4444D',
      contactPerson: 'David Miller',
      email: 'david@starlight.com',
      phone: '+91 65432 10987',
      address: 'Anna Salai, Chennai, India',
      status: 'PENDING',
      rating: 0.0,
    },
  });

  // Create RFQ 1: Hardware procurement (Status: PO_GENERATED)
  const rfq1Items = JSON.stringify([
    { name: 'Enterprise Developer Laptops (i7, 32GB, 1TB SSD)', quantity: 20, unit: 'Units' },
    { name: 'Dual 27-inch Monitors', quantity: 40, unit: 'Units' },
  ]);
  const rfq1 = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2026-000001',
      title: 'High-Performance Developer Workstations',
      description: 'Procuring workstations for the incoming batch of engineering hires. Deliverable timeline is urgent.',
      productDetails: rfq1Items,
      budget: 3500000.00,
      deadline: new Date('2026-06-15T18:00:00Z'),
      status: 'PO_GENERATED',
      createdById: officer.id,
    },
  });

  // Create RFQ 2: Cloud Licensing (Status: UNDER_REVIEW)
  const rfq2Items = JSON.stringify([
    { name: 'Kubernetes Cloud Cluster Hosting (Annual)', quantity: 1, unit: 'Lot' },
    { name: 'CI/CD Platform Premium Accounts', quantity: 50, unit: 'Users' },
  ]);
  const rfq2 = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2026-000002',
      title: 'Cloud Infrastructure & CI/CD Tooling',
      description: 'Yearly renewal of enterprise cloud development clusters and build automation seats.',
      productDetails: rfq2Items,
      budget: 1500000.00,
      deadline: new Date('2026-06-25T18:00:00Z'),
      status: 'UNDER_REVIEW',
      createdById: officer.id,
    },
  });

  // Create RFQ 3: Office Furniture (Status: SUBMITTED - Quotations being submitted)
  const rfq3Items = JSON.stringify([
    { name: 'Ergonomic Mesh Office Chairs', quantity: 100, unit: 'Units' },
    { name: 'Adjustable Standing Desks', quantity: 50, unit: 'Units' },
  ]);
  const rfq3 = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2026-000003',
      title: 'Ergonomic Workspace Office Furniture',
      description: 'Furniture overhaul for Bangalore head office to improve workplace ergonomics.',
      productDetails: rfq3Items,
      budget: 2000000.00,
      deadline: new Date('2026-07-10T18:00:00Z'),
      status: 'SUBMITTED',
      createdById: officer.id,
    },
  });

  // Assign Vendors to RFQs
  await prisma.rfqVendor.createMany({
    data: [
      { rfqId: rfq1.id, vendorId: vendor1.id },
      { rfqId: rfq1.id, vendorId: vendor2.id },
      { rfqId: rfq2.id, vendorId: vendor1.id },
      { rfqId: rfq2.id, vendorId: vendor2.id },
      { rfqId: rfq3.id, vendorId: vendor3.id },
    ],
  });

  // Submit Quotations for RFQ 1 (Hardware Workstations)
  const quote1 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendor1.id,
      price: 3200000.00,
      taxes: 576000.00,
      deliveryTimeline: 7, // 7 days
      notes: 'Apex Solutions offers 3-year enterprise warranty on all units. Ready to ship in stock.',
      status: 'ACCEPTED',
    },
  });

  const quote2 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendor2.id,
      price: 3400000.00,
      taxes: 612000.00,
      deliveryTimeline: 10,
      notes: 'Zenith Tech provides full installation and next-business-day hardware replacement.',
      status: 'REJECTED',
    },
  });

  // Submit Quotations for RFQ 2 (Cloud Licensing) - Under Review
  await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      vendorId: vendor1.id,
      price: 1400000.00,
      taxes: 252000.00,
      deliveryTimeline: 3,
      notes: 'Includes cloud migration support bundle.',
      status: 'SUBMITTED',
    },
  });

  await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      vendorId: vendor2.id,
      price: 1250000.00,
      taxes: 225000.00,
      deliveryTimeline: 1,
      notes: 'Immediate setup. Official gold partner discount applied.',
      status: 'SUBMITTED',
    },
  });

  // Add Approval Log for RFQ 1
  await prisma.approval.create({
    data: {
      rfqId: rfq1.id,
      status: 'APPROVED',
      remarks: 'Quote from Apex Solutions (VEND-000001) meets budget constraints and offers excellent delivery times.',
      approverId: manager.id,
    },
  });

  // Generate Purchase Order for RFQ 1
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-000001',
      rfqId: rfq1.id,
      vendorId: vendor1.id,
      approvedQuoteId: quote1.id,
      totalAmount: 3776000.00, // Price + Tax
      tax: 576000.00,
      status: 'ACCEPTED',
      createdById: officer.id,
    },
  });

  // Generate Invoice for PO 1 (Status: PAID)
  const gstBreakdown = JSON.stringify({
    cgst: 288000.00,
    sgst: 288000.00,
    igst: 0.00,
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-000001',
      purchaseOrderId: po.id,
      totalAmount: 3776000.00,
      taxAmount: 576000.00,
      gstBreakdown: gstBreakdown,
      status: 'PAID',
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        message: 'RFQ-2026-000002 has received new quotations and is pending your review.',
        type: 'APPROVAL_PENDING',
      },
      {
        userId: officer.id,
        message: 'Invoice INV-2026-000001 has been marked as PAID by Apex Solutions.',
        type: 'INVOICE_GENERATED',
      },
      {
        userId: vendorUser1.id,
        message: 'You have been assigned to RFQ-2026-000002: Cloud Infrastructure.',
        type: 'RFQ_ASSIGNED',
      },
    ],
  });

  // Activity Logs
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: 'LOGIN', details: 'Administrator logged in from IP 192.168.1.15' },
      { userId: officer.id, action: 'RFQ_CREATION', details: 'Created RFQ-2026-000001: Developer Workstations' },
      { userId: vendorUser1.id, action: 'QUOTATION_SUBMITTING', details: 'Submitted Quotation for RFQ-2026-000001 with total value 3,200,000 INR' },
      { userId: manager.id, action: 'APPROVAL_ACTION', details: 'Approved RFQ-2026-000001 and accepted Apex Solutions quotation' },
      { userId: officer.id, action: 'INVOICE_GENERATION', details: 'Generated Invoice INV-2026-000001 for PO-2026-000001' },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

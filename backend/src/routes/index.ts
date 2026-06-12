import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';

import * as authController from '../controllers/authController';
import * as vendorController from '../controllers/vendorController';
import * as rfqController from '../controllers/rfqController';
import * as quotationController from '../controllers/quotationController';
import * as approvalController from '../controllers/approvalController';
import * as poController from '../controllers/poController';
import * as invoiceController from '../controllers/invoiceController';
import * as notificationController from '../controllers/notificationController';
import * as adminController from '../controllers/adminController';
import * as aiController from '../controllers/aiController';
import * as superAdminController from '../controllers/superAdminController';

const router = Router();

// ==========================================
// Authentication Module
// ==========================================
router.post('/auth/login', authController.login);
router.post('/auth/signup', authController.signup);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// ==========================================
// Vendor Management Module
// ==========================================
router.get('/vendors', authenticateToken, vendorController.getAllVendors);
router.get('/vendors/:id', authenticateToken, vendorController.getVendorById);
router.post(
  '/vendors',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
  vendorController.createVendor
);
router.put(
  '/vendors/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
  vendorController.updateVendor
);
router.delete(
  '/vendors/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  vendorController.deleteVendor
);

// ==========================================
// RFQ Management Module
// ==========================================
router.get('/rfqs', authenticateToken, rfqController.getAllRfqs);
router.get('/rfqs/:id', authenticateToken, rfqController.getRfqById);
router.post(
  '/rfqs',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
  rfqController.createRfq
);
router.put(
  '/rfqs/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'), // Vendor updates when submitting quotations
  rfqController.updateRfq
);
router.delete(
  '/rfqs/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
  rfqController.deleteRfq
);

// ==========================================
// Quotation Management & AI Comparison Engine
// ==========================================
router.post(
  '/quotations',
  authenticateToken,
  requireRoles('VENDOR'),
  quotationController.submitQuotation
);
router.get(
  '/quotations/rfq/:rfqId',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'),
  quotationController.getQuotationsByRfq
);
router.get(
  '/quotations/compare/:rfqId',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'),
  quotationController.getComparisonMatrix
);

// ==========================================
// Approval Workflow Engine
// ==========================================
router.post(
  '/approvals/review',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
  approvalController.submitForReview
);
router.post(
  '/approvals/process',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  approvalController.processApproval
);

// ==========================================
// Purchase Order Module
// ==========================================
router.get('/pos', authenticateToken, poController.getAllPos);
router.get('/pos/:id', authenticateToken, poController.getPoById);
router.post(
  '/pos',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
  poController.createPurchaseOrder
);
router.put(
  '/pos/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'),
  poController.updatePoStatus
);

// ==========================================
// Invoice Module
// ==========================================
router.get('/invoices', authenticateToken, invoiceController.getAllInvoices);
router.get('/invoices/:id', authenticateToken, invoiceController.getInvoiceById);
router.post(
  '/invoices',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'),
  invoiceController.createInvoice
);
router.post(
  '/invoices/:id/pay',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'),
  invoiceController.payInvoice
);
router.post(
  '/invoices/:id/send',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'),
  invoiceController.sendInvoice
);

// ==========================================
// AI Procurement & Chat Assistant Module
// ==========================================
router.get(
  '/ai/invoice-insights/:id',
  authenticateToken,
  aiController.getInvoiceInsightsEndpoint
);
router.post(
  '/ai/chat',
  authenticateToken,
  aiController.chatAssistantEndpoint
);

// ==========================================
// Notifications Module
// ==========================================
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.post('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);
router.put('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
router.delete('/notifications/:id', authenticateToken, notificationController.clearNotification);

// ==========================================
// Dashboard Metrics, Audit Logs, & Administration
// ==========================================
router.get(
  '/admin/metrics',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'),
  adminController.getDashboardMetrics
);
router.get(
  '/admin/logs',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  adminController.getAuditLogs
);
router.get(
  '/admin/users',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  adminController.getAllUsers
);

// ==========================================
// SUPER ADMIN MODULE
// ==========================================
router.post(
  '/super-admin/users',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  superAdminController.createUser
);
router.put(
  '/super-admin/users/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  superAdminController.updateUser
);
router.delete(
  '/super-admin/users/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  superAdminController.deleteUser
);

export default router;

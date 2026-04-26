import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as feeController from '../controllers/fee.controller.js';

const router = express.Router();
router.use(protect);

// ============================================
// FEE TYPES
// ============================================
router.get('/types', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getAllFeeTypes);
router.post('/types', authorize('ADMIN', 'SUPER_ADMIN'), feeController.createFeeType);
router.put('/types/:id', authorize('ADMIN', 'SUPER_ADMIN'), feeController.updateFeeType);
router.delete('/types/:id', authorize('SUPER_ADMIN'), feeController.deleteFeeType);

// ============================================
// FEE STRUCTURES (Assignments) - UPDATED
// ============================================
router.get('/next-term', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getNextTerm);
router.post('/assign/class', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.assignFeesToClass);
router.post('/assign/student', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.assignFeesToStudent);
router.get('/student/:studentId/term/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'), feeController.getStudentFees);
router.get('/class/:classId/term/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getClassFees);

// ============================================
// PAYMENTS
// ============================================
router.post('/payments', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.recordPayment);
router.get('/payments', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getAllPayments);
router.get('/payments/:id', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'), feeController.getPaymentById);
router.get('/payments/:id/receipt', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'), feeController.generateReceipt);
router.get('/student/:studentId/payments', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'), feeController.getStudentPayments);

// Add these routes
router.post('/payments/bulk', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.recordBulkPayment);
router.get('/receipts/:receiptNumber', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'), feeController.getReceiptByNumber);
// ============================================
// REPORTS
// ============================================
router.get('/reports/collection/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getFeeCollectionReport);
router.get('/summary/:studentId/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'), feeController.getStudentFeeSummary);

// Add these routes to your existing fee.routes.ts

// Auto-charge endpoints
router.post('/auto-charge', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.autoChargeStudentsForNewTerm);
router.get('/auto-chargeable/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getAutoChargeableFeeStructures);
router.post('/classes/:classId/terms/:termId/bulk-assign', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.bulkAssignFeesToClass);

// ============================================
// FEE TEMPLATES
// ============================================
router.get('/templates', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getAllFeeTemplates);
router.post('/templates', authorize('ADMIN', 'SUPER_ADMIN'), feeController.createFeeTemplate);
router.put('/templates/:id', authorize('ADMIN', 'SUPER_ADMIN'), feeController.updateFeeTemplate);
router.delete('/templates/:id', authorize('SUPER_ADMIN'), feeController.deleteFeeTemplate);

// ============================================
// FEE TEMPLATE ASSIGNMENTS
// ============================================
router.post('/templates/assign', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.assignTemplateToClass);
router.get('/templates/assignments', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getClassTemplateAssignments);

// ============================================
// SCHOLARSHIP ROUTES
// ============================================
router.get('/scholarships', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.getAllScholarships);
router.get('/students/:studentId/scholarships', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'), feeController.getStudentScholarships);
router.post('/scholarships', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.createScholarship);
router.put('/scholarships/:id', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.updateScholarship);
router.delete('/scholarships/:id', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.deleteScholarship);
router.post('/scholarships/bulk', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), feeController.bulkCreateScholarships);
export default router;
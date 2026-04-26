import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as reportController from '../controllers/report.controller.js';

const router = express.Router();
router.use(protect);

router.get('/dashboard', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'TEACHER'), reportController.getDashboardStats);
// Add this route
router.get('/attendance', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), reportController.getAttendanceReport);
// report.routes.ts - add:
router.get('/finances', authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), reportController.getFinancialReport);

export default router;
import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as reportCardController from '../controllers/reportCard.controller.js';

const router = express.Router();
router.use(protect);

// Generate and view report cards
router.get('/student/:studentId/term/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), reportCardController.generateReportCard);
router.get('/class/:classId/term/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), reportCardController.generateClassReportCards);
router.put('/:reportCardId/remarks', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), reportCardController.updateRemarks);
router.get('/download/:studentId/term/:termId', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), reportCardController.downloadReportCardPDF);

export default router;
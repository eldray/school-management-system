import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as promotionController from '../controllers/promotion.controller.js';

const router = express.Router();
router.use(protect);

// Get eligible students for promotion
router.get('/class/:classId/term/:termId/eligible', authorize('ADMIN', 'SUPER_ADMIN'), promotionController.getEligibleStudents);

// Promote a single class
router.post('/class/:classId/term/:termId', authorize('ADMIN', 'SUPER_ADMIN'), promotionController.promoteClass);

// Promote all classes
router.post('/all/term/:termId', authorize('ADMIN', 'SUPER_ADMIN'), promotionController.promoteAllClasses);

// Get promotion history for a student
router.get('/student/:studentId/history', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT'), promotionController.getPromotionHistory);

// Manually promote a student
router.post('/student/:studentId/promote', authorize('ADMIN', 'SUPER_ADMIN'), promotionController.manuallyPromoteStudent);

// Manually repeat a student
router.post('/student/:studentId/repeat', authorize('ADMIN', 'SUPER_ADMIN'), promotionController.manuallyRepeatStudent);

export default router;
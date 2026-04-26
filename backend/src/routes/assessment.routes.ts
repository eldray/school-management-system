import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as assessmentController from '../controllers/assessment.controller.js';

const router = express.Router();
router.use(protect);

// Assessment Types
router.get('/types', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.getAssessmentTypes);
router.post('/types', authorize('ADMIN', 'SUPER_ADMIN'), assessmentController.createAssessmentType);

// Assessments
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.getAssessments);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.getAssessmentById);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.createAssessment);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.updateAssessment);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), assessmentController.deleteAssessment);

// Assessment Scores
router.get('/:id/scores', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.getAssessmentScores);
router.post('/:id/scores', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.recordScores);
router.get('/student/:studentId/scores', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), assessmentController.getStudentScores);

export default router;
import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as examController from '../controllers/exam.controller.js';
import * as termController from '../controllers/term.controller.js';
import * as subjectController from '../controllers/subject.controller.js';

const router = express.Router();
router.use(protect);

// ============================================
// TERM ROUTES
// ============================================
router.get('/terms', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), termController.getAllTerms);
router.get('/terms/active', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), termController.getActiveTerm);
router.post('/terms', authorize('ADMIN', 'SUPER_ADMIN'), termController.createTerm);
router.put('/terms/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), termController.setActiveTerm);
router.put('/terms/:id', authorize('ADMIN', 'SUPER_ADMIN'), termController.updateTerm);
router.delete('/terms/:id', authorize('SUPER_ADMIN'), termController.deleteTerm);

// ============================================
// AUTO TERM PROGRESSION ROUTES
// ============================================
router.post('/terms/auto-advance', authorize('ADMIN', 'SUPER_ADMIN'), termController.autoAdvanceTerm);
router.get('/terms/progression-status', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), termController.getTermProgressionStatus);
router.post('/terms/check-advance', authorize('ADMIN', 'SUPER_ADMIN'), termController.checkAndAutoAdvance);

// ============================================
// SUBJECT ROUTES
// ============================================
router.get('/subjects', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), subjectController.getAllSubjects);
router.post('/subjects', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.createSubject);
router.put('/subjects/:id', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.updateSubject);
router.patch('/subjects/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.activateSubject);
router.delete('/subjects/:id', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.deleteSubject);
router.post('/subjects/assign-to-class', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.assignSubjectToClass);
router.post('/subjects/assign-teacher', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.assignTeacherToSubject);
router.get('/classes/:classId/subjects', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), subjectController.getClassSubjects);
// ============================================
// EXAM ROUTES
// ============================================
router.get('/teacher-options', authorize('TEACHER'), examController.getTeacherExamOptionsController);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.getAllExams);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.getExamById);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.createExam);
router.put('/:id/publish', authorize('ADMIN', 'SUPER_ADMIN'), examController.publishExam);

// Exam Subjects
router.get('/:examId/classes/:classId/subjects', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.getExamSubjectsByClass);
router.get('/exam-subjects/:examSubjectId/results', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.getExamSubjectResults);

// ============================================
// RESULTS ROUTES
// ============================================
router.post('/results', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.recordResult);
router.get('/students/:studentId/results', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), examController.getStudentResults);
router.get('/classes/:classId/exams/:examId/results', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.getClassResults);

export default router;
import express from 'express';
import {
  createClassController,
  getAllClassesController,
  getClassByIdController,
  updateClassController,
  deleteClassController,
  assignTeacherController,
  removeTeacherController,
  getAvailableTeachersController,
  getTeacherVisibleClassesController,
  getTeacherAccessibleClassesController,
  getClassStatisticsController,
} from '../controllers/class.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createClassSchema, updateClassSchema } from '../validators/class.validator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes accessible by Admin and Teachers
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), getAllClassesController);
router.get('/statistics', authorize('ADMIN', 'SUPER_ADMIN'), getClassStatisticsController);
router.get('/teachers/available', authorize('ADMIN', 'SUPER_ADMIN'), getAvailableTeachersController);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), getClassByIdController);
// Teacher gets their visible classes (with permissions)
router.get('/teacher/visible', authorize('TEACHER'), getTeacherVisibleClassesController);
// Add this route to class.routes.ts
router.get('/teacher/accessible', authorize('TEACHER'), getTeacherAccessibleClassesController);

// Admin-only routes
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), validate(createClassSchema), createClassController);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), validate(updateClassSchema), updateClassController);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteClassController);

// Teacher assignment routes
router.post('/:classId/assign-teacher', authorize('ADMIN', 'SUPER_ADMIN'), assignTeacherController);
router.delete('/:classId/remove-teacher', authorize('ADMIN', 'SUPER_ADMIN'), removeTeacherController);

export default router;
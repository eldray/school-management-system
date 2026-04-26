import express from 'express';
import { 
  createStudentController, 
  getStudentsController,
  getStudentByIdController,
  updateStudentController,
  deleteStudentController,
  activateStudentController
} from '../controllers/student.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createStudentSchema } from '../validators/student.validator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/', authorize('ADMIN', 'TEACHER', 'SUPER_ADMIN'), getStudentsController);
router.get('/:id', authorize('ADMIN', 'TEACHER', 'SUPER_ADMIN'), getStudentByIdController);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), validate(createStudentSchema), createStudentController);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateStudentController);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteStudentController);
router.patch('/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), activateStudentController);
    
export default router;
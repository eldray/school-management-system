import express from 'express';
import {
  getAllUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController,
  getProfileController,
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile route (works for all authenticated users)
router.get('/profile', getProfileController);

// Admin only routes
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createUserController);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), getAllUsersController);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), getUserByIdController);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateUserController);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteUserController);

export default router;
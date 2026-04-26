import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as announcementController from '../controllers/announcement.controller.js';

const router = express.Router();
router.use(protect);

// Everyone can view announcements
router.get('/', announcementController.getAllAnnouncements);
router.get('/unread-count', announcementController.getUnreadCount);
router.get('/:id', announcementController.getAnnouncementById);

// Everyone can mark as read
router.post('/:id/read', announcementController.markAsRead);

// Admins and Teachers can create
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), announcementController.createAnnouncement);

// Authors can update their own, Admins can update any
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), announcementController.updateAnnouncement);

// Only Admins and Super Admins can delete
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), announcementController.deleteAnnouncement);

export default router;
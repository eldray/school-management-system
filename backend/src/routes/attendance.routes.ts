import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as attendanceController from '../controllers/attendance.controller.js';

const router = express.Router();
router.use(protect);

// Mark attendance (teachers, admins)
router.post('/mark', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), attendanceController.markAttendance);
router.post('/mark/bulk', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), attendanceController.markBulkAttendance);

// View attendance
router.get('/class/:classId', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), attendanceController.getClassAttendance);
router.get('/student/:studentId', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), attendanceController.getStudentAttendance);
router.get('/student/:studentId/stats', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), attendanceController.getStudentAttendanceStats);
router.get('/class/:classId/stats', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), attendanceController.getClassAttendanceStats);
router.get('/summary', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), attendanceController.getAttendanceSummary);

export default router;
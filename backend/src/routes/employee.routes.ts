import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as employeeController from '../controllers/employee.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee CRUD
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.getAllEmployeesController);
router.get('/statistics', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.getEmployeeStatisticsController);
router.get('/subjects', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.getAvailableSubjectsController);
router.patch('/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.activateEmployeeController);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), employeeController.getEmployeeByIdController);
router.get('/:employeeId/classes', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), employeeController.getEmployeeClassesController);

// Subject assignments (for teachers)
router.get('/:employeeId/subjects', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), employeeController.getEmployeeSubjectsController);
router.post('/subjects/assign', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.assignSubjectToEmployeeController);
router.delete('/subjects/:employeeId/:subjectId/:classId', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.removeSubjectFromEmployeeController);

// Leave Management
router.get('/:employeeId/leaves', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), employeeController.getEmployeeLeavesController);
router.post('/:employeeId/leaves', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), employeeController.requestLeaveController);

// Admin-only routes
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.createEmployeeController);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), employeeController.updateEmployeeController);
router.delete('/:id', authorize('SUPER_ADMIN'), employeeController.deleteEmployeeController);

export default router;
import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service.js';

export const createEmployeeController = async (req: Request, res: Response) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create employee',
    });
  }
};

export const getAllEmployeesController = async (req: Request, res: Response) => {
  try {
    const { employeeType, isActive, department } = req.query;
    const employees = await employeeService.getAllEmployees({
      employeeType: employeeType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      department: department as string,
    });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employees',
    });
  }
};

export const getEmployeeByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    console.error('Get employee error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Employee not found',
    });
  }
};

export const updateEmployeeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.updateEmployee(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error: any) {
    console.error('Update employee error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update employee',
    });
  }
};

export const deleteEmployeeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await employeeService.deleteEmployee(id);

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
    });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete employee',
    });
  }
};

export const activateEmployeeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.activateEmployee(id);

    res.status(200).json({
      success: true,
      message: 'Employee activated successfully',
      data: employee,
    });
  } catch (error: any) {
    console.error('Activate employee error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to activate employee',
    });
  }
};

export const getEmployeeClassesController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const classes = await employeeService.getEmployeeClasses(employeeId);

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    console.error('Get employee classes error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Employee not found',
    });
  }
};

export const getEmployeeStatisticsController = async (req: Request, res: Response) => {
  try {
    const statistics = await employeeService.getEmployeeStatistics();

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('Get employee statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics',
    });
  }
};

export const getAvailableSubjectsController = async (req: Request, res: Response) => {
  try {
    const subjects = await employeeService.getAvailableSubjects();

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error: any) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subjects',
    });
  }
};

// Subject assignment for teachers
export const getEmployeeSubjectsController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const subjects = await employeeService.getEmployeeSubjects(employeeId);
    res.status(200).json({ success: true, data: subjects });
  } catch (error: any) {
    console.error('Get employee subjects error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignSubjectToEmployeeController = async (req: Request, res: Response) => {
  try {
    const { employeeId, subjectId, classId } = req.body;
    const result = await employeeService.assignSubjectToEmployee(employeeId, subjectId, classId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Assign subject error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeSubjectFromEmployeeController = async (req: Request, res: Response) => {
  try {
    const { employeeId, subjectId, classId } = req.params;
    await employeeService.removeSubjectFromEmployee(employeeId, subjectId, classId);
    res.status(200).json({ success: true, message: 'Subject removed successfully' });
  } catch (error: any) {
    console.error('Remove subject error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Leave Management
export const requestLeaveController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const leave = await employeeService.requestLeave(employeeId, req.body);
    res.status(201).json({ success: true, data: leave });
  } catch (error: any) {
    console.error('Request leave error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmployeeLeavesController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const leaves = await employeeService.getEmployeeLeaves(employeeId);
    res.status(200).json({ success: true, data: leaves });
  } catch (error: any) {
    console.error('Get leaves error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
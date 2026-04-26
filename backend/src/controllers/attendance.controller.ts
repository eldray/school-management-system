import { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.service.js';

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await attendanceService.markAttendance({
      ...req.body,
      date: new Date(req.body.date),
    });
    res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    console.error('Mark attendance error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await attendanceService.markBulkAttendance({
      ...req.body,
      date: new Date(req.body.date),
    });
    res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    console.error('Bulk attendance error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getClassAttendance = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const attendance = await attendanceService.getClassAttendance(
      classId,
      date ? new Date(date as string) : new Date()
    );
    res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    console.error('Get class attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    const attendance = await attendanceService.getStudentAttendance(
      studentId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId } = req.query;
    const stats = await attendanceService.getStudentAttendanceStats(studentId, termId as string);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get student stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    const stats = await attendanceService.getClassAttendanceStats(
      classId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get class stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const summary = await attendanceService.getAttendanceSummary(
      classId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
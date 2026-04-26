import { Request, Response } from 'express';
import * as reportService from '../services/report.service.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await reportService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const stats = await reportService.getDetailedAttendanceStats({
      classId: classId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add this to your existing report.controller.ts

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { classId, termId, startDate, endDate } = req.query;
    const stats = await reportService.getDetailedAttendanceStats({
      classId: classId as string,
      termId: termId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// report.controller.ts - add:
export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    const { classId, termId, startDate, endDate } = req.query;
    const report = await reportService.getDetailedFinancialReport({
      classId: classId as string,
      termId: termId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.status(200).json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
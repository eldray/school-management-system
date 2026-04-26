import { Request, Response } from 'express';
import * as promotionService from '../services/promotion.service.js';

export const getEligibleStudents = async (req: Request, res: Response) => {
  try {
    const { classId, termId } = req.params;
    const students = await promotionService.getEligibleStudentsForPromotion(classId, termId);
    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    console.error('Get eligible students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const promoteClass = async (req: Request, res: Response) => {
  try {
    const { classId, termId } = req.params;
    const criteria = req.body;
    const result = await promotionService.promoteStudents(classId, termId, criteria);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Promote class error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const promoteAllClasses = async (req: Request, res: Response) => {
  try {
    const { termId } = req.params;
    const criteria = req.body;
    const result = await promotionService.promoteAllClasses(termId, criteria);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Promote all classes error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPromotionHistory = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const history = await promotionService.getPromotionHistory(studentId);
    res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    console.error('Get promotion history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const manuallyPromoteStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { toClassId, termId, reason } = req.body;
    const result = await promotionService.manuallyPromoteStudent(studentId, toClassId, termId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Manually promote student error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const manuallyRepeatStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId, reason } = req.body;
    const result = await promotionService.manuallyRepeatStudent(studentId, termId, reason);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Manually repeat student error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
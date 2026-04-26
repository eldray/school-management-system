import { Request, Response } from 'express';
import * as reportCardService from '../services/reportCard.service.js';

export const generateReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId, termId } = req.params;
    const reportCard = await reportCardService.generateReportCard(studentId, termId);
    res.status(200).json({ success: true, data: reportCard });
  } catch (error: any) {
    console.error('Generate report card error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateClassReportCards = async (req: Request, res: Response) => {
  try {
    const { classId, termId } = req.params;
    const reportCards = await reportCardService.generateClassReportCards(classId, termId);
    res.status(200).json({ success: true, data: reportCards });
  } catch (error: any) {
    console.error('Generate class report cards error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRemarks = async (req: Request, res: Response) => {
  try {
    const { reportCardId } = req.params;
    const { teacherRemarks, principalRemarks } = req.body;
    const user = (req as any).user;
    
    const updated = await reportCardService.updateRemarks(reportCardId, {
      teacherRemarks,
      principalRemarks,
      updatedBy: user.id,
    });
    
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update remarks error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const downloadReportCardPDF = async (req: Request, res: Response) => {
  try {
    const { studentId, termId } = req.params;
    const pdf = await reportCardService.generateReportCardPDF(studentId, termId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-card-${studentId}-${termId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    console.error('Download PDF error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
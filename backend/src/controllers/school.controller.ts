import { Request, Response } from 'express';
import * as schoolService from '../services/school.service.js';

export const getSchoolSettings = async (req: Request, res: Response) => {
  try {
    const settings = await schoolService.getSchoolSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Get school settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchoolSettings = async (req: Request, res: Response) => {
  try {
    const settings = await schoolService.updateSchoolSettings(req.body);
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Update school settings error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const settings = await schoolService.updateSchoolLogo(logoUrl);
    
    res.status(200).json({ 
      success: true, 
      data: { 
        logoUrl: settings.schoolLogo,
        message: 'Logo uploaded successfully' 
      } 
    });
  } catch (error: any) {
    console.error('Upload logo error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGradingScale = async (req: Request, res: Response) => {
  try {
    const settings = await schoolService.getSchoolSettings();
    
    if (settings.gradingSystem === 'CUSTOM' && settings.customGrades) {
      return res.status(200).json({ 
        success: true, 
        data: settings.customGrades,
        system: 'CUSTOM',
      });
    }
    
    const defaultGrades = schoolService.getDefaultGradingScale();
    res.status(200).json({ 
      success: true, 
      data: defaultGrades,
      system: 'STANDARD',
    });
  } catch (error: any) {
    console.error('Get grading scale error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ACADEMIC YEAR & TERM PROGRESSION ENDPOINTS
// ============================================

export const getCurrentAcademicYear = async (req: Request, res: Response) => {
  try {
    const year = await schoolService.getCurrentAcademicYear();
    const currentTerm = await schoolService.getCurrentActiveTerm();
    res.status(200).json({ 
      success: true, 
      data: { 
        academicYear: year,
        currentTerm 
      } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAcademicYears = async (req: Request, res: Response) => {
  try {
    const years = await schoolService.getAllAcademicYears();
    res.status(200).json({ success: true, data: years });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const advanceAcademicYear = async (req: Request, res: Response) => {
  try {
    const result = await schoolService.manualAdvanceAcademicYear();
    res.status(200).json({ 
      success: true, 
      data: result,
      message: `Academic year advanced from ${result.previousYear} to ${result.newYear}` 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAndAdvanceTerm = async (req: Request, res: Response) => {
  try {
    const result = await schoolService.checkAndAdvanceTerm();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const checkAcademicYearAdvance = async (req: Request, res: Response) => {
  try {
    const result = await schoolService.checkAndAdvanceTerm();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const manualAdvanceTerm = async (req: Request, res: Response) => {
  try {
    const result = await schoolService.manualAdvanceTerm();
    res.status(200).json({ 
      success: true, 
      data: result,
      message: result.action === 'TERM_ADVANCED' 
        ? `Advanced from ${result.fromTerm} to ${result.toTerm}`
        : `Advanced to new academic year: ${result.newYear}`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTermProgressionStatus = async (req: Request, res: Response) => {
  try {
    const status = await schoolService.getTermProgressionStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
import { Request, Response } from 'express';
import * as subjectService from '../services/subject.service.js';

export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = await subjectService.createSubject(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignSubjectToClass = async (req: Request, res: Response) => {
  try {
    const { classId, subjectId } = req.body;
    const result = await subjectService.assignSubjectToClass(classId, subjectId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignTeacherToSubject = async (req: Request, res: Response) => {
  try {
    const { teacherId, subjectId, classId } = req.body;
    const result = await subjectService.assignTeacherToSubject(teacherId, subjectId, classId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getClassSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await subjectService.getClassSubjects(req.params.classId);
    res.status(200).json({ success: true, data: subjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await subjectService.updateSubject(id, req.body);
    res.status(200).json({ success: true, data: subject });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await subjectService.deleteSubject(id);
    res.status(200).json({ 
      success: true, 
      message: 'Subject deactivated successfully',
      data: subject 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const activateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await subjectService.activateSubject(id);
    res.status(200).json({ 
      success: true, 
      message: 'Subject activated successfully',
      data: subject 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update getAllSubjects to accept includeInactive query param
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    const subjects = await subjectService.getAllSubjects(includeInactive === 'true');
    res.status(200).json({ success: true, data: subjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
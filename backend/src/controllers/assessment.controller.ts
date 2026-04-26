import { Request, Response } from 'express';
import * as assessmentService from '../services/assessment.service.js';

export const getAssessmentTypes = async (req: Request, res: Response) => {
  try {
    const types = await assessmentService.getAssessmentTypes();
    res.status(200).json({ success: true, data: types });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssessmentType = async (req: Request, res: Response) => {
  try {
    const type = await assessmentService.createAssessmentType(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAssessments = async (req: Request, res: Response) => {
  try {
    const { classId, termId, subjectId } = req.query;
    const assessments = await assessmentService.getAssessments({
      classId: classId as string,
      termId: termId as string,
      subjectId: subjectId as string,
    });
    res.status(200).json({ success: true, data: assessments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssessmentById = async (req: Request, res: Response) => {
  try {
    const assessment = await assessmentService.getAssessmentById(req.params.id);
    res.status(200).json({ success: true, data: assessment });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createAssessment = async (req: Request, res: Response) => {
  try {
    console.log('Creating assessment with data:', req.body);
    const assessment = await assessmentService.createAssessment({
      ...req.body,
      date: new Date(req.body.date),
      totalMarks: req.body.totalMarks || 20,
    });
    res.status(201).json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('Create assessment error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAssessment = async (req: Request, res: Response) => {
  try {
    const assessment = await assessmentService.updateAssessment(req.params.id, {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined,
    });
    res.status(200).json({ success: true, data: assessment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAssessment = async (req: Request, res: Response) => {
  try {
    await assessmentService.deleteAssessment(req.params.id);
    res.status(200).json({ success: true, message: 'Assessment deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAssessmentScores = async (req: Request, res: Response) => {
  try {
    const scores = await assessmentService.getAssessmentScores(req.params.id);
    res.status(200).json({ success: true, data: scores });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordScores = async (req: Request, res: Response) => {
  try {
    const { scores } = req.body;
    const result = await assessmentService.recordScores(req.params.id, scores);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStudentScores = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId } = req.query;
    const scores = await assessmentService.getStudentScores(studentId, termId as string);
    res.status(200).json({ success: true, data: scores });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
import { Request, Response } from 'express';
import * as examService from '../services/exam.service.js';

export const createExam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subjects } = req.body;
    
    // Check permissions based on role
    if (user.role === 'TEACHER') {
      const teacherOptions = await examService.getTeacherExamOptions(user.id);
      
      // Verify teacher can create exam for the requested class/subjects
      for (const subject of subjects) {
        const canCreate = teacherOptions.classTeacherClasses.some(
          (c: any) => c.id === subject.classId
        ) || teacherOptions.subjectTeacherOptions.some(
          (s: any) => s.classId === subject.classId && s.subjectId === subject.subjectId
        );
        
        if (!canCreate) {
          return res.status(403).json({
            success: false,
            message: `You don't have permission to create exams for this class/subject`,
          });
        }
      }
    }
    
    const exam = await examService.createExam({
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    });
    
    res.status(201).json({ success: true, data: exam });
  } catch (error: any) {
    console.error('Create exam error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllExams = async (req: Request, res: Response) => {
  try {
    const { termId, type } = req.query;
    const exams = await examService.getAllExams({
      termId: termId as string,
      type: type as any,
    });
    res.status(200).json({ success: true, data: exams });
  } catch (error: any) {
    console.error('Get exams error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamById = async (req: Request, res: Response) => {
  try {
    const exam = await examService.getExamById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.status(200).json({ success: true, data: exam });
  } catch (error: any) {
    console.error('Get exam error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamSubjectsByClass = async (req: Request, res: Response) => {
  try {
    const { examId, classId } = req.params;
    const subjects = await examService.getExamSubjectsByClass(examId, classId);
    res.status(200).json({ success: true, data: subjects });
  } catch (error: any) {
    console.error('Get exam subjects error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamSubjectResults = async (req: Request, res: Response) => {
  try {
    const { examSubjectId } = req.params;
    const results = await examService.getExamSubjectResults(examSubjectId);
    res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    console.error('Get exam subject results error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Record exam result - check teacher has permission
export const recordResult = async (req: AuthRequest, res: Response) => {
  try {
    const { examSubjectId, studentId, marksObtained } = req.body;
    const teacherUserId = req.user?.id;
    
    // Get teacher permission for this exam subject
    const teacher = await prisma.teacherProfile.findFirst({
      where: { user: { id: teacherUserId } },
      include: {
        classes: true,
        teacherSubjects: true,
      },
    });
    
    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: 'Teacher profile not found',
      });
    }
    
    const isUnassigned = teacher.classes.length === 0 && teacher.teacherSubjects.length === 0;
    
    // Unassigned teachers CANNOT enter results
    if (isUnassigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to any class or subject. Cannot enter results.',
      });
    }
    
    // Get the exam subject to check class and subject
    const examSubject = await prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: { exam: true },
    });
    
    if (!examSubject) {
      return res.status(404).json({
        success: false,
        message: 'Exam subject not found',
      });
    }
    
    // Check if teacher has permission
    const isClassTeacher = teacher.classes.some(c => c.id === examSubject.classId);
    const teachesSubject = teacher.teacherSubjects.some(ts => 
      ts.classId === examSubject.classId && ts.subjectId === examSubject.subjectId
    );
    
    if (!isClassTeacher && !teachesSubject) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to enter results for this exam',
      });
    }
    
    const result = await examService.recordExamResult(
      examSubjectId,
      studentId,
      marksObtained,
      teacher.userId
    );
    
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Record result error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get class results - check view permission
export const getClassResults = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, examId } = req.params;
    const teacherUserId = req.user?.id;
    
    const teacher = await prisma.teacherProfile.findFirst({
      where: { user: { id: teacherUserId } },
      include: { classes: true, teacherSubjects: true },
    });
    
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Teacher not found' });
    }
    
    const isUnassigned = teacher.classes.length === 0 && teacher.teacherSubjects.length === 0;
    
    if (isUnassigned) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view results',
      });
    }
    
    const isClassTeacher = teacher.classes.some(c => c.id === classId);
    const teachesInClass = teacher.teacherSubjects.some(ts => ts.classId === classId);
    
    if (!isClassTeacher && !teachesInClass) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view results for this class',
      });
    }
    
    const results = await examService.getClassResults(classId, examId);
    res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    console.error('Get class results error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentResults = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query;
    const results = await examService.getStudentResults(studentId, examId as string);
    res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    console.error('Get student results error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const publishExam = async (req: Request, res: Response) => {
  try {
    const exam = await examService.publishExam(req.params.id);
    res.status(200).json({ success: true, data: exam, message: 'Exam published successfully' });
  } catch (error: any) {
    console.error('Publish exam error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get teacher's exam creation options
export const getTeacherExamOptionsController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const options = await examService.getTeacherExamOptions(user.id);
    res.status(200).json({ success: true, data: options });
  } catch (error: any) {
    console.error('Get teacher options error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

import prisma from '../config/prisma.js';
import { ExamType, GradeScale } from '@prisma/client';

export interface CreateExamInput {
  name: string;
  type: ExamType;
  termId: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  subjects: {
    classId: string;
    subjectId: string;
    examDate: Date;
    startTime?: string;
    duration?: number;
    totalMarks?: number;
    passingMarks?: number;
  }[];
}

// Default grading scales
const DEFAULT_GRADES = [
  { grade: 'A1', minScore: 80, maxScore: 100, remark: 'Excellent' },
  { grade: 'B2', minScore: 70, maxScore: 79, remark: 'Very Good' },
  { grade: 'B3', minScore: 65, maxScore: 69, remark: 'Good' },
  { grade: 'C4', minScore: 60, maxScore: 64, remark: 'Credit' },
  { grade: 'C5', minScore: 55, maxScore: 59, remark: 'Credit' },
  { grade: 'C6', minScore: 50, maxScore: 54, remark: 'Credit' },
  { grade: 'D7', minScore: 45, maxScore: 49, remark: 'Pass' },
  { grade: 'E8', minScore: 40, maxScore: 44, remark: 'Pass' },
  { grade: 'F9', minScore: 0, maxScore: 39, remark: 'Fail' },
];

// Get grading scale from settings
const getGradingScale = async () => {
  const settings = await prisma.schoolSettings.findFirst();
  
  if (settings?.gradingSystem === 'CUSTOM' && settings.customGrades) {
    const grades = settings.customGrades as any[];
    return grades.sort((a, b) => b.minScore - a.minScore);
  }
  
  return DEFAULT_GRADES;
};

// Calculate grade based on school settings
const calculateGrade = async (percentage: number): Promise<{ grade: string; remark: string }> => {
  const grades = await getGradingScale();
  
  for (const gradeScale of grades) {
    if (percentage >= gradeScale.minScore && percentage <= gradeScale.maxScore) {
      return { grade: gradeScale.grade, remark: gradeScale.remark };
    }
  }
  
  return { grade: 'F9', remark: 'Fail' };
};

export const createExam = async (data: CreateExamInput) => {
  const { subjects, ...examData } = data;
  
  // Use upsert to handle duplicate exam (same term, type, academicYear)
  const exam = await prisma.exam.upsert({
    where: {
      termId_type_academicYear: {
        termId: examData.termId,
        type: examData.type,
        academicYear: examData.academicYear,
      },
    },
    update: {
      name: examData.name,
      startDate: new Date(examData.startDate),
      endDate: new Date(examData.endDate),
    },
    create: {
      name: examData.name,
      type: examData.type,
      termId: examData.termId,
      academicYear: examData.academicYear,
      startDate: new Date(examData.startDate),
      endDate: new Date(examData.endDate),
    },
  });
  
  // Create or update exam subjects
  const examSubjects = await Promise.all(
    subjects.map(async (subject) => {
      return prisma.examSubject.upsert({
        where: {
          examId_classId_subjectId: {
            examId: exam.id,
            classId: subject.classId,
            subjectId: subject.subjectId,
          },
        },
        update: {
          examDate: new Date(subject.examDate),
          startTime: subject.startTime,
          duration: subject.duration,
          totalMarks: subject.totalMarks || 100,
          passingMarks: subject.passingMarks || 40,
        },
        create: {
          examId: exam.id,
          classId: subject.classId,
          subjectId: subject.subjectId,
          examDate: new Date(subject.examDate),
          startTime: subject.startTime,
          duration: subject.duration,
          totalMarks: subject.totalMarks || 100,
          passingMarks: subject.passingMarks || 40,
        },
        include: {
          class: true,
          subject: true,
        },
      });
    })
  );
  
  return { ...exam, examSubjects };
};

export const getAllExams = async (filters?: { termId?: string; type?: ExamType }) => {
  const where: any = {};
  if (filters?.termId) where.termId = filters.termId;
  if (filters?.type) where.type = filters.type;

  return prisma.exam.findMany({
    where,
    include: {
      term: true,
      examSubjects: {
        include: {
          class: true,
          subject: true,
          _count: { select: { results: true } },
        },
      },
      _count: { select: { examSubjects: true } },
    },
    orderBy: { startDate: 'desc' },
  });
};

export const getExamById = async (id: string) => {
  return prisma.exam.findUnique({
    where: { id },
    include: {
      term: true,
      examSubjects: {
        include: {
          class: true,
          subject: true,
          _count: { select: { results: true } },
        },
        orderBy: [
          { examDate: 'asc' },
          { subject: { name: 'asc' } },
        ],
      },
    },
  });
};

export const getExamSubjectsByClass = async (examId: string, classId: string) => {
  return prisma.examSubject.findMany({
    where: { examId, classId },
    include: {
      subject: true,
      _count: { select: { results: true } },
    },
    orderBy: [
      { examDate: 'asc' },
      { subject: { name: 'asc' } },
    ],
  });
};

export const getExamSubjectResults = async (examSubjectId: string) => {
  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
    include: {
      exam: { include: { term: true } },
      class: true,
      subject: true,
    },
  });
  
  if (!examSubject) throw new Error('Exam subject not found');
  
  const students = await prisma.student.findMany({
    where: { classId: examSubject.classId, status: 'ACTIVE' },
    include: {
      examResults: { where: { examSubjectId } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
  
  return { examSubject, students };
};

// MAIN recordExamResult - uses dynamic grading from settings
export const recordExamResult = async (
  examSubjectId: string,
  studentId: string,
  marksObtained: number,
  gradedBy?: string
) => {
  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
    select: { totalMarks: true },
  });
  
  if (!examSubject) throw new Error('Exam subject not found');
  
  const percentage = (marksObtained / examSubject.totalMarks) * 100;
  const { grade, remark } = await calculateGrade(percentage);
  
  return prisma.examResult.upsert({
    where: { examSubjectId_studentId: { examSubjectId, studentId } },
    update: {
      marksObtained,
      percentage,
      grade: grade as GradeScale,
      remarks: remark,
      gradedBy,
      gradedAt: new Date(),
      isFinalized: true,
      isAbsent: false,
    },
    create: {
      examSubjectId,
      studentId,
      marksObtained,
      percentage,
      grade: grade as GradeScale,
      remarks: remark,
      gradedBy,
      gradedAt: new Date(),
      isFinalized: true,
    },
    include: { student: true },
  });
};

export const getStudentResults = async (studentId: string, examId?: string) => {
  return prisma.examResult.findMany({
    where: {
      studentId,
      ...(examId && { examSubject: { examId } }),
    },
    include: {
      examSubject: {
        include: {
          exam: { include: { term: true } },
          subject: true,
        },
      },
    },
    orderBy: { examSubject: { examDate: 'asc' } },
  });
};

export const getClassResults = async (classId: string, examId: string) => {
  return prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    include: {
      examResults: {
        where: { examSubject: { examId } },
        include: {
          examSubject: { include: { subject: true } },
        },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
};

export const publishExam = async (examId: string) => {
  return prisma.exam.update({
    where: { id: examId },
    data: { isPublished: true },
  });
};

// Get classes and subjects a teacher can create exams for
export const getTeacherExamOptions = async (teacherUserId: string) => {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { id: teacherUserId } },
    include: {
      classes: {
        include: {
          classSubjects: {
            include: { subject: true },
          },
        },
      },
      teacherSubjects: {
        include: {
          class: true,
          subject: true,
        },
      },
    },
  });
  
  if (!teacher) {
    return { 
      classTeacherClasses: [], 
      subjectTeacherOptions: [],
      canCreateExams: false,
      canEnterResults: false,
    };
  }
  
  const hasClassAssignments = teacher.classes.length > 0;
  const hasSubjectAssignments = teacher.teacherSubjects.length > 0;
  
  // CASE 3: Teacher has NO assignments - NO operational permissions
  if (!hasClassAssignments && !hasSubjectAssignments) {
    return {
      classTeacherClasses: [],
      subjectTeacherOptions: [],
      canCreateExams: false,
      canEnterResults: false,
      isUnassigned: true,
    };
  }
  
  // CASE 1 & 2: Teacher has assignments
  return {
    classTeacherClasses: teacher.classes.map(c => ({
      id: c.id,
      name: c.name,
      subjects: c.classSubjects.map(cs => ({
        id: cs.subject.id,
        name: cs.subject.name,
        code: cs.subject.code,
      })),
    })),
    subjectTeacherOptions: teacher.teacherSubjects.map(ts => ({
      classId: ts.class.id,
      className: ts.class.name,
      subjectId: ts.subject.id,
      subjectName: ts.subject.name,
      subjectCode: ts.subject.code,
    })),
    canCreateExams: true,
    canEnterResults: true,
    isUnassigned: false,
  };
};
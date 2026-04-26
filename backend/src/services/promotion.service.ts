import prisma from '../config/prisma.js';
import { StudentStatus } from '@prisma/client';

export interface PromotionCriteria {
  minAttendance: number;
  minAverage: number;
  maxFailedSubjects: number;
}

const DEFAULT_CRITERIA: PromotionCriteria = {
  minAttendance: 75,
  minAverage: 40,
  maxFailedSubjects: 2,
};

export const getEligibleStudentsForPromotion = async (classId: string, termId: string) => {
  const term = await prisma.academicTerm.findUnique({ where: { id: termId } });
  if (!term) throw new Error('Term not found');
  
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    include: {
      attendances: {
        where: { date: { gte: term.startDate, lte: term.endDate } },
      },
      examResults: {
        where: { examSubject: { exam: { termId } } },
        include: { examSubject: { include: { subject: true } } },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
  
  return students.map(student => {
    const totalDays = student.attendances.length;
    const presentDays = student.attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;
    
    const examResults = student.examResults;
    const subjectsTaken = examResults.length;
    const passedSubjects = examResults.filter(r => (r.percentage || 0) >= 40).length;
    const averageScore = subjectsTaken > 0
      ? examResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / subjectsTaken
      : 0;
    
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      attendancePercentage,
      averageScore,
      subjectsTaken,
      passedSubjects,
      failedSubjects: subjectsTaken - passedSubjects,
    };
  });
};

export const promoteStudents = async (classId: string, currentTermId: string, criteria: PromotionCriteria = DEFAULT_CRITERIA) => {
  const currentClass = await prisma.class.findUnique({ where: { id: classId } });
  if (!currentClass) throw new Error('Class not found');
  
  // Get the next class (same stream, next grade level)
  const nextClass = await prisma.class.findFirst({
    where: {
      gradeLevel: currentClass.gradeLevel + 1,
      stream: currentClass.stream,
    },
  });
  
  if (!nextClass) throw new Error('Next class not found. Please create it first.');
  
  const students = await getEligibleStudentsForPromotion(classId, currentTermId);
  
  const results = [];
  
  for (const student of students) {
    const meetsAttendance = student.attendancePercentage >= criteria.minAttendance;
    const meetsAcademic = student.averageScore >= criteria.minAverage && 
                         student.failedSubjects <= criteria.maxFailedSubjects;
    const shouldPromote = meetsAttendance && meetsAcademic;
    
    const newClassId = shouldPromote ? nextClass.id : classId;
    const promotionStatus = shouldPromote ? 'PROMOTED' : 'REPEATED';
    
    // Update student class
    await prisma.student.update({
      where: { id: student.id },
      data: { classId: newClassId },
    });
    
    // Record promotion history
    await prisma.studentPromotion.create({
      data: {
        studentId: student.id,
        fromClassId: classId,
        toClassId: newClassId,
        termId: currentTermId,
        status: promotionStatus as any,
        attendancePercentage: student.attendancePercentage,
        averageScore: student.averageScore,
        subjectsTaken: student.subjectsTaken,
        subjectsPassed: student.passedSubjects,
        subjectsFailed: student.failedSubjects,
      },
    });
    
    results.push({
      student: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      attendance: student.attendancePercentage.toFixed(1) + '%',
      average: student.averageScore.toFixed(1) + '%',
      passed: `${student.passedSubjects}/${student.subjectsTaken}`,
      status: promotionStatus,
    });
  }
  
  return {
    fromClass: currentClass.name,
    toClass: nextClass.name,
    totalStudents: students.length,
    promoted: results.filter(r => r.status === 'PROMOTED').length,
    repeated: results.filter(r => r.status === 'REPEATED').length,
    results,
  };
};

export const promoteAllClasses = async (termId: string, criteria?: PromotionCriteria) => {
  const classes = await prisma.class.findMany({
    where: {
      students: { some: { status: 'ACTIVE' } },
    },
    orderBy: { gradeLevel: 'asc' },
  });
  
  const results = [];
  for (const cls of classes) {
    if (cls.gradeLevel >= 12) continue;
    
    try {
      const result = await promoteStudents(cls.id, termId, criteria);
      results.push(result);
    } catch (error: any) {
      console.error(`Failed to promote class ${cls.name}:`, error.message);
    }
  }
  
  return results;
};

export const getPromotionHistory = async (studentId: string) => {
  return prisma.studentPromotion.findMany({
    where: { studentId },
    include: {
      fromClass: true,
      toClass: true,
      term: true,
    },
    orderBy: { term: { startDate: 'desc' } },
  });
};

export const manuallyPromoteStudent = async (studentId: string, toClassId: string, termId: string, reason?: string) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });
  
  if (!student) throw new Error('Student not found');
  
  await prisma.student.update({
    where: { id: studentId },
    data: { classId: toClassId },
  });
  
  return prisma.studentPromotion.create({
    data: {
      studentId,
      fromClassId: student.classId!,
      toClassId,
      termId,
      status: 'PROMOTED',
      remarks: reason,
    },
  });
};

export const manuallyRepeatStudent = async (studentId: string, termId: string, reason?: string) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });
  
  if (!student) throw new Error('Student not found');
  
  return prisma.studentPromotion.create({
    data: {
      studentId,
      fromClassId: student.classId!,
      toClassId: student.classId!,
      termId,
      status: 'REPEATED',
      remarks: reason,
    },
  });
};
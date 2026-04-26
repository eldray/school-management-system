import prisma from '../config/prisma.js';

// Assessment Types
export const getAssessmentTypes = async () => {
  let types = await prisma.assessmentType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  
  // If no types exist, create default ones
  if (types.length === 0) {
    const defaultTypes = [
      { name: 'Class Test', weight: 20, description: 'Regular class tests' },
      { name: 'Quiz', weight: 15, description: 'Quick quizzes' },
      { name: 'Project', weight: 25, description: 'Term projects' },
      { name: 'Homework', weight: 10, description: 'Daily homework' },
    ];
    
    for (const typeData of defaultTypes) {
      await prisma.assessmentType.create({ data: typeData });
    }
    
    types = await prisma.assessmentType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
  
  return types;
};

export const createAssessmentType = async (data: { name: string; weight: number; description?: string }) => {
  return prisma.assessmentType.create({ data });
};

// Assessments
export const getAssessments = async (filters: { classId?: string; termId?: string; subjectId?: string }) => {
  const where: any = {};
  if (filters.classId) where.classId = filters.classId;
  if (filters.termId) where.termId = filters.termId;
  if (filters.subjectId) where.subjectId = filters.subjectId;

  return prisma.assessment.findMany({
    where,
    include: {
      type: true,
      subject: true,
      class: {
        include: {
          _count: { select: { students: true } },
        },
      },
      term: true,
      _count: { select: { scores: true } },
    },
    orderBy: { date: 'desc' },
  });
};

export const getAssessmentById = async (id: string) => {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      type: true,
      subject: true,
      class: true,
      term: true,
    },
  });
  if (!assessment) throw new Error('Assessment not found');
  return assessment;
};

export const createAssessment = async (data: any) => {
  // Get the assessment type ID from the type name
  let typeId = data.typeId;
  
  if (!typeId && data.type) {
    const assessmentType = await prisma.assessmentType.findFirst({
      where: { name: data.type },
    });
    
    if (!assessmentType) {
      // Create the type if it doesn't exist
      const newType = await prisma.assessmentType.create({
        data: { 
          name: data.type, 
          weight: data.type === 'Quiz' ? 15 : data.type === 'Class Test' ? 20 : 25,
        },
      });
      typeId = newType.id;
    } else {
      typeId = assessmentType.id;
    }
  }
  
  return prisma.assessment.create({
    data: {
      typeId,
      subjectId: data.subjectId,
      classId: data.classId,
      termId: data.termId,
      name: data.name,
      totalMarks: data.totalMarks || 20,
      date: new Date(data.date),
    },
    include: {
      type: true,
      subject: true,
      class: true,
      term: true,
    },
  });
};

export const updateAssessment = async (id: string, data: any) => {
  return prisma.assessment.update({ where: { id }, data });
};

export const deleteAssessment = async (id: string) => {
  return prisma.assessment.delete({ where: { id } });
};

// Scores
export const getAssessmentScores = async (assessmentId: string) => {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { class: true, subject: true, type: true },
  });
  
  if (!assessment) throw new Error('Assessment not found');
  
  const students = await prisma.student.findMany({
    where: { classId: assessment.classId, status: 'ACTIVE' },
    include: {
      assessmentScores: { where: { assessmentId } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
  
  return { assessment, students };
};

export const recordScores = async (assessmentId: string, scores: { studentId: string; marksObtained: number; remarks?: string }[]) => {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { totalMarks: true },
  });
  
  if (!assessment) throw new Error('Assessment not found');
  
  const results = [];
  for (const score of scores) {
    const percentage = (score.marksObtained / assessment.totalMarks) * 100;
    const result = await prisma.assessmentScore.upsert({
      where: {
        assessmentId_studentId: { assessmentId, studentId: score.studentId },
      },
      update: {
        marksObtained: score.marksObtained,
        percentage,
        remarks: score.remarks,
      },
      create: {
        assessmentId,
        studentId: score.studentId,
        marksObtained: score.marksObtained,
        percentage,
        remarks: score.remarks,
      },
    });
    results.push(result);
  }
  return results;
};

export const getStudentScores = async (studentId: string, termId?: string) => {
  return prisma.assessmentScore.findMany({
    where: {
      studentId,
      ...(termId && { assessment: { termId } }),
    },
    include: {
      assessment: {
        include: {
          type: true,
          subject: true,
          term: true,
        },
      },
    },
    orderBy: { assessment: { date: 'desc' } },
  });
};
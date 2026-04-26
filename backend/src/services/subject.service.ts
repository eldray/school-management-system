import prisma from '../config/prisma.js';

export interface CreateSubjectInput {
  name: string;
  code: string;
  description?: string;
  category?: string;
}

export const createSubject = async (data: CreateSubjectInput) => {
  return prisma.subject.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      category: data.category,
    },
  });
};

export const assignSubjectToClass = async (classId: string, subjectId: string) => {
  return prisma.classSubject.upsert({
    where: {
      classId_subjectId: { classId, subjectId },
    },
    update: {},
    create: { classId, subjectId },
  });
};

export const assignTeacherToSubject = async (teacherId: string, subjectId: string, classId: string) => {
  return prisma.teacherSubject.upsert({
    where: {
      teacherId_subjectId_classId: { teacherId, subjectId, classId },
    },
    update: {},
    create: { teacherId, subjectId, classId },
  });
};

// FIXED: Get class subjects with teacher assignments
export const getClassSubjects = async (classId: string) => {
  // Get all subjects assigned to this class
  const classSubjects = await prisma.classSubject.findMany({
    where: { classId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          category: true,
        }
      },
    },
    orderBy: {
      subject: {
        name: 'asc'
      }
    },
  });

  // Get all teacher subject assignments for this class
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: {
      classId: classId,
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        }
      }
    },
  });

  // Group teacher subjects by subject ID
  const teacherSubjectsBySubject = teacherSubjects.reduce((acc, ts) => {
    const subjectId = ts.subjectId;
    if (!acc[subjectId]) {
      acc[subjectId] = [];
    }
    acc[subjectId].push(ts);
    return acc;
  }, {} as Record<string, typeof teacherSubjects>);

  // Merge teacher subjects into class subjects
  return classSubjects.map(cs => ({
    id: cs.id,
    classId: cs.classId,
    subjectId: cs.subjectId,
    subject: cs.subject,
    teacherSubjects: teacherSubjectsBySubject[cs.subjectId] || [],
  }));
};

export const updateSubject = async (id: string, data: Partial<CreateSubjectInput>) => {
  return prisma.subject.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code?.toUpperCase(),
      description: data.description,
      category: data.category,
    },
  });
};

export const deleteSubject = async (id: string) => {
  // Check if subject has existing exam results
  const examResults = await prisma.examResult.count({
    where: { examSubject: { subjectId: id } },
  });
  
  // Soft delete - just set isActive to false
  return prisma.subject.update({
    where: { id },
    data: { isActive: false },
  });
};

export const activateSubject = async (id: string) => {
  return prisma.subject.update({
    where: { id },
    data: { isActive: true },
  });
};

export const getAllSubjects = async (includeInactive: boolean = false) => {
  return prisma.subject.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          classSubjects: true,
          teacherSubjects: true,
          examSubjects: true,
        },
      },
    },
  });
};
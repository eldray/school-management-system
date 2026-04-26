import prisma from '../config/prisma.js';
import { TermType } from '@prisma/client';

export interface CreateTermInput {
  name: string;
  type: TermType;
  academicYear: string;
  startDate: Date;
  endDate: Date;
}

export const createTerm = async (data: CreateTermInput) => {
  const term = await prisma.academicTerm.create({
    data: {
      name: data.name,
      type: data.type,
      academicYear: data.academicYear,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: false,
    },
  });
  
  return term;
};

export const getAllTerms = async () => {
  return prisma.academicTerm.findMany({
    orderBy: [{ academicYear: 'desc' }, { startDate: 'desc' }],
    include: {
      _count: {
        select: { exams: true },
      },
    },
  });
};

export const getActiveTerm = async () => {
  return prisma.academicTerm.findFirst({
    where: { isActive: true },
    include: {
      exams: true,
    },
  });
};

export const setActiveTerm = async (id: string) => {
  await prisma.academicTerm.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });
  
  return prisma.academicTerm.update({
    where: { id },
    data: { isActive: true },
  });
};

export const updateTerm = async (id: string, data: Partial<CreateTermInput>) => {
  return prisma.academicTerm.update({
    where: { id },
    data,
  });
};

export const deleteTerm = async (id: string) => {
  const term = await prisma.academicTerm.findUnique({
    where: { id },
    include: { _count: { select: { exams: true } } },
  });
  
  if (term?._count.exams) {
    throw new Error('Cannot delete term with existing exams');
  }
  
  return prisma.academicTerm.delete({ where: { id } });
};

// ============================================
// AUTO TERM PROGRESSION LOGIC
// ============================================

export const getCurrentTermByDate = async () => {
  const today = new Date();
  
  const currentTerm = await prisma.academicTerm.findFirst({
    where: {
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });
  
  return currentTerm;
};

export const getNextTermInSequence = async (currentTerm: any) => {
  const termOrder = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM'];
  const currentIndex = termOrder.indexOf(currentTerm.type);
  
  if (currentIndex === -1 || currentIndex === termOrder.length - 1) {
    return null;
  }
  
  const nextTermType = termOrder[currentIndex + 1];
  
  const nextTerm = await prisma.academicTerm.findFirst({
    where: {
      academicYear: currentTerm.academicYear,
      type: nextTermType,
    },
  });
  
  return nextTerm;
};

const parseAcademicYear = (academicYear: string): { startYear: number; endYear: number } => {
  const [start, end] = academicYear.split('/').map(Number);
  return { startYear: start, endYear: end };
};

export const createDefaultTermsForAcademicYear = async (academicYear: string) => {
  const { startYear, endYear } = parseAcademicYear(academicYear);
  
  const termDates = [
    { type: 'FIRST_TERM', name: `First Term ${academicYear}`, startDate: new Date(startYear, 8, 1), endDate: new Date(startYear, 11, 15) },
    { type: 'SECOND_TERM', name: `Second Term ${academicYear}`, startDate: new Date(startYear, 11, 15), endDate: new Date(startYear + 1, 2, 15) },
    { type: 'THIRD_TERM', name: `Third Term ${academicYear}`, startDate: new Date(startYear + 1, 2, 15), endDate: new Date(startYear + 1, 6, 30) },
  ];
  
  const createdTerms = [];
  for (const term of termDates) {
    const newTerm = await prisma.academicTerm.create({
      data: {
        name: term.name,
        type: term.type as TermType,
        academicYear: academicYear,
        startDate: term.startDate,
        endDate: term.endDate,
        isActive: false,
      },
    });
    createdTerms.push(newTerm);
  }
  
  return createdTerms;
};

export const autoAdvanceTerm = async () => {
  const today = new Date();
  
  const expiredActiveTerm = await prisma.academicTerm.findFirst({
    where: {
      isActive: true,
      endDate: { lt: today },
    },
  });
  
  if (!expiredActiveTerm) {
    return { advanced: false, message: 'No expired active term found' };
  }
  
  const isThirdTerm = expiredActiveTerm.type === 'THIRD_TERM';
  
  if (isThirdTerm) {
    const { endYear } = parseAcademicYear(expiredActiveTerm.academicYear);
    const nextAcademicYear = `${endYear}/${endYear + 1}`;
    
    const nextYearTerms = await prisma.academicTerm.findMany({
      where: { academicYear: nextAcademicYear },
    });
    
    if (nextYearTerms.length === 0) {
      await createDefaultTermsForAcademicYear(nextAcademicYear);
    }
    
    const firstTermNextYear = await prisma.academicTerm.findFirst({
      where: {
        academicYear: nextAcademicYear,
        type: 'FIRST_TERM',
      },
    });
    
    if (firstTermNextYear) {
      await prisma.academicTerm.update({
        where: { id: expiredActiveTerm.id },
        data: { isActive: false },
      });
      
      await prisma.academicTerm.update({
        where: { id: firstTermNextYear.id },
        data: { isActive: true },
      });
      
      await prisma.schoolSettings.updateMany({
        data: { currentAcademicYear: nextAcademicYear },
      });
      
      // Auto-assign fees for the new term
      await autoAssignFeesForNewTerm(firstTermNextYear.id);
      
      return {
        advanced: true,
        message: `Advanced to next academic year: ${nextAcademicYear}`,
        newTerm: firstTermNextYear,
        newAcademicYear: nextAcademicYear,
      };
    }
  } else {
    const nextTerm = await getNextTermInSequence(expiredActiveTerm);
    
    if (nextTerm) {
      await prisma.academicTerm.update({
        where: { id: expiredActiveTerm.id },
        data: { isActive: false },
      });
      
      await prisma.academicTerm.update({
        where: { id: nextTerm.id },
        data: { isActive: true },
      });
      
      return {
        advanced: true,
        message: `Advanced to next term: ${nextTerm.name}`,
        newTerm: nextTerm,
      };
    }
  }
  
  return { advanced: false, message: 'No next term found' };
};

// ============================================
// AUTO ASSIGN FEES FOR NEW TERM
// ============================================

export const autoAssignFeesForNewTerm = async (newTermId: string) => {
  // Use classFeeTemplate (correct model name)
  const classAssignments = await prisma.classFeeTemplate.findMany({
    where: {
      termId: newTermId,
      isActive: true,
    },
    include: {
      template: {
        include: {
          items: true,
        },
      },
      class: true,
    },
  });
  
  const results = [];
  
  for (const assignment of classAssignments) {
    const students = await prisma.student.findMany({
      where: {
        classId: assignment.classId,
        status: 'ACTIVE',
      },
    });
    
    let feesCreated = 0;
    
    for (const student of students) {
      for (const item of assignment.template.items) {
        const existing = await prisma.feeStructure.findFirst({
          where: {
            studentId: student.id,
            feeTypeId: item.feeTypeId,
            termId: newTermId,
          },
        });
        
        if (!existing) {
          await prisma.feeStructure.create({
            data: {
              feeTypeId: item.feeTypeId,
              studentId: student.id,
              amount: item.amount,
              termId: newTermId,
            },
          });
          feesCreated++;
        }
      }
      
      // Update student fee summary
      const feeService = await import('./fee.service.js');
      await feeService.updateStudentFeeSummary(student.id, newTermId);
    }
    
    results.push({
      classId: assignment.classId,
      className: assignment.class.name,
      studentsCount: students.length,
      feesCreated,
    });
  }
  
  return {
    termId: newTermId,
    classesProcessed: results.length,
    details: results,
  };
};

export const checkAndAutoAdvance = async () => {
  const result = await autoAdvanceTerm();
  
  if (result.advanced) {
    console.log(`[Auto-Advance] ${result.message}`);
  }
  
  return result;
};

export const getTermProgressionStatus = async () => {
  const today = new Date();
  const activeTerm = await getActiveTerm();
  
  if (!activeTerm) {
    return {
      hasActiveTerm: false,
      message: 'No active term set',
    };
  }
  
  const daysUntilEnd = Math.ceil((new Date(activeTerm.endDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
  const isExpired = daysUntilEnd < 0;
  const isThirdTerm = activeTerm.type === 'THIRD_TERM';
  
  let nextTermInfo = null;
  
  if (isExpired) {
    if (isThirdTerm) {
      const { endYear } = parseAcademicYear(activeTerm.academicYear);
      nextTermInfo = {
        type: 'ACADEMIC_YEAR',
        nextAcademicYear: `${endYear}/${endYear + 1}`,
        nextTerm: 'First Term',
      };
    } else {
      const nextTerm = await getNextTermInSequence(activeTerm);
      if (nextTerm) {
        nextTermInfo = {
          type: 'TERM',
          nextTermName: nextTerm.name,
          nextTermStartDate: nextTerm.startDate,
        };
      }
    }
  }
  
  return {
    hasActiveTerm: true,
    activeTerm: {
      id: activeTerm.id,
      name: activeTerm.name,
      type: activeTerm.type,
      academicYear: activeTerm.academicYear,
      startDate: activeTerm.startDate,
      endDate: activeTerm.endDate,
      daysUntilEnd: daysUntilEnd,
      isExpired: isExpired,
      isThirdTerm: isThirdTerm,
    },
    nextTerm: nextTermInfo,
  };
};
import prisma from '../config/prisma.js';

export interface UpdateSchoolSettingsInput {
  schoolName?: string;
  schoolCode?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string;
  schoolMotto?: string;
  principalName?: string;
  establishedYear?: number;
  currentAcademicYear?: string;
  defaultTermType?: string;
  allowParentLogin?: boolean;
  allowStudentLogin?: boolean;
  defaultLanguage?: string;
  timezone?: string;
  gradingSystem?: string;
  customGrades?: GradeScaleConfig[];
  defaultPassingMarks?: number;
  defaultTotalMarks?: number;
  defaultExamDuration?: number;
  enabledExamTypes?: Record<string, boolean>;
}

export interface GradeScaleConfig {
  grade: string;
  minScore: number;
  maxScore: number;
  remark: string;
}

// ============================================
// SCHOOL SETTINGS
// ============================================

export const getSchoolSettings = async () => {
  let settings = await prisma.schoolSettings.findFirst();
  
  if (!settings) {
    const currentYear = new Date().getFullYear();
    settings = await prisma.schoolSettings.create({
      data: {
        schoolName: 'Excellence Academy',
        schoolMotto: 'Excellence in Education',
        currentAcademicYear: `${currentYear}/${currentYear + 1}`,
        gradingSystem: 'STANDARD',
        defaultPassingMarks: 40,
        defaultTotalMarks: 100,
        defaultExamDuration: 60,
        enabledExamTypes: {
          MID_TERM: true,
          END_OF_TERM: true,
          MOCK: true,
          FINAL: true,
        },
      },
    });
  }
  
  return settings;
};

export const updateSchoolSettings = async (data: UpdateSchoolSettingsInput) => {
  const settings = await getSchoolSettings();
  
  return prisma.schoolSettings.update({
    where: { id: settings.id },
    data,
  });
};

export const updateSchoolLogo = async (logoUrl: string) => {
  const settings = await getSchoolSettings();
  
  return prisma.schoolSettings.update({
    where: { id: settings.id },
    data: { schoolLogo: logoUrl },
  });
};

export const getDefaultGradingScale = () => {
  return [
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
};

// ============================================
// ACADEMIC YEAR HELPERS
// ============================================

export const getCurrentAcademicYear = async () => {
  const settings = await getSchoolSettings();
  return settings.currentAcademicYear;
};

export const parseAcademicYear = (academicYear: string): { startYear: number; endYear: number } => {
  const [start, end] = academicYear.split('/').map(Number);
  return { startYear: start, endYear: end };
};

export const getNextAcademicYear = (currentYear: string): string => {
  const { startYear, endYear } = parseAcademicYear(currentYear);
  return `${endYear}/${endYear + 1}`;
};

export const getAllAcademicYears = async () => {
  const terms = await prisma.academicTerm.findMany({
    select: { academicYear: true },
    distinct: ['academicYear'],
    orderBy: { academicYear: 'desc' },
  });
  return terms.map(t => t.academicYear);
};

// ============================================
// TERM MANAGEMENT
// ============================================

export const getCurrentActiveTerm = async () => {
  const term = await prisma.academicTerm.findFirst({
    where: { isActive: true },
    include: {
      _count: { select: { exams: true } },
    },
  });
  return term;
};

// Advance to next academic year
export const advanceToNextAcademicYear = async () => {
  const settings = await getSchoolSettings();
  const currentYear = settings.currentAcademicYear;
  const nextYear = getNextAcademicYear(currentYear);
  
  // Deactivate all current terms
  await prisma.academicTerm.updateMany({
    where: { academicYear: currentYear },
    data: { isActive: false },
  });
  
  // Update school settings to new academic year
  await prisma.schoolSettings.update({
    where: { id: settings.id },
    data: { currentAcademicYear: nextYear },
  });
  
  // Create default terms for the new academic year
  const { startYear, endYear } = parseAcademicYear(nextYear);
  
  const termConfigs = [
    {
      type: 'FIRST_TERM',
      name: `First Term ${nextYear}`,
      startDate: new Date(startYear, 8, 1),   // September 1
      endDate: new Date(startYear, 11, 15),  // December 15
    },
    {
      type: 'SECOND_TERM',
      name: `Second Term ${nextYear}`,
      startDate: new Date(startYear, 11, 1),  // December 1
      endDate: new Date(startYear + 1, 2, 15), // March 15
    },
    {
      type: 'THIRD_TERM',
      name: `Third Term ${nextYear}`,
      startDate: new Date(startYear + 1, 2, 1), // March 1
      endDate: new Date(startYear + 1, 6, 30),  // June 30
    },
  ];
  
  for (let i = 0; i < termConfigs.length; i++) {
    const config = termConfigs[i];
    await prisma.academicTerm.upsert({
      where: {
        academicYear_type: {
          academicYear: nextYear,
          type: config.type as any,
        },
      },
      update: {
        name: config.name,
        startDate: config.startDate,
        endDate: config.endDate,
        isActive: i === 0,
      },
      create: {
        name: config.name,
        type: config.type as any,
        academicYear: nextYear,
        startDate: config.startDate,
        endDate: config.endDate,
        isActive: i === 0,
      },
    });
  }
  
  const newFirstTerm = await prisma.academicTerm.findFirst({
    where: { academicYear: nextYear, type: 'FIRST_TERM' },
  });
  
  return {
    action: 'ACADEMIC_YEAR_ADVANCED',
    previousYear: currentYear,
    newYear: nextYear,
    activeTerm: newFirstTerm?.name,
  };
};

// Check and auto-advance terms based on dates
export const checkAndAdvanceTerm = async () => {
  const today = new Date();
  const currentTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
  });
  
  if (!currentTerm) return { action: 'NO_ACTIVE_TERM' };
  
  const termEndDate = new Date(currentTerm.endDate);
  
  if (today > termEndDate) {
    const settings = await getSchoolSettings();
    const currentAcademicYear = settings.currentAcademicYear;
    
    const termsInYear = await prisma.academicTerm.findMany({
      where: { academicYear: currentAcademicYear },
      orderBy: { startDate: 'asc' },
    });
    
    const currentIndex = termsInYear.findIndex(t => t.id === currentTerm.id);
    const nextTerm = termsInYear[currentIndex + 1];
    
    if (nextTerm) {
      await prisma.$transaction([
        prisma.academicTerm.update({
          where: { id: currentTerm.id },
          data: { isActive: false },
        }),
        prisma.academicTerm.update({
          where: { id: nextTerm.id },
          data: { isActive: true },
        }),
      ]);
      
      return {
        action: 'TERM_ADVANCED',
        fromTerm: currentTerm.name,
        toTerm: nextTerm.name,
      };
    } else {
      const isThirdTerm = currentTerm.type === 'THIRD_TERM';
      if (isThirdTerm) {
        const daysAfterEnd = Math.ceil((today.getTime() - termEndDate.getTime()) / (1000 * 3600 * 24));
        if (daysAfterEnd >= 30) {
          return await advanceToNextAcademicYear();
        } else {
          return {
            action: 'PENDING_ACADEMIC_YEAR_ADVANCE',
            daysRemaining: 30 - daysAfterEnd,
          };
        }
      }
    }
  }
  
  return { action: 'NO_CHANGE' };
};

// Manual term advance (admin can force advance to next term)
export const manualAdvanceTerm = async () => {
  const currentTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
  });
  
  if (!currentTerm) {
    throw new Error('No active term found');
  }
  
  const settings = await getSchoolSettings();
  const currentAcademicYear = settings.currentAcademicYear;
  
  const termsInYear = await prisma.academicTerm.findMany({
    where: { academicYear: currentAcademicYear },
    orderBy: { startDate: 'asc' },
  });
  
  const currentIndex = termsInYear.findIndex(t => t.id === currentTerm.id);
  const nextTerm = termsInYear[currentIndex + 1];
  
  if (nextTerm) {
    await prisma.$transaction([
      prisma.academicTerm.update({
        where: { id: currentTerm.id },
        data: { isActive: false },
      }),
      prisma.academicTerm.update({
        where: { id: nextTerm.id },
        data: { isActive: true },
      }),
    ]);
    
    return {
      action: 'TERM_ADVANCED',
      fromTerm: currentTerm.name,
      toTerm: nextTerm.name,
      academicYear: currentAcademicYear,
    };
  } else {
    return await advanceToNextAcademicYear();
  }
};

// Manual academic year progression (admin triggered)
export const manualAdvanceAcademicYear = async () => {
  // Check if there are any active students who need promotion first
  const activeStudents = await prisma.student.count({
    where: { status: 'ACTIVE' },
  });
  
  // Optional warning: if there are active students, you might want to warn
  if (activeStudents > 0) {
    console.log(`Warning: ${activeStudents} active students still need promotion processing`);
  }
  
  return advanceToNextAcademicYear();
};

// Get term progression status
export const getTermProgressionStatus = async () => {
  const currentTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
  });
  
  if (!currentTerm) {
    return { hasActiveTerm: false };
  }
  
  const today = new Date();
  const termEndDate = new Date(currentTerm.endDate);
  const daysLeft = Math.ceil((termEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const isEnded = today > termEndDate;
  
  const settings = await getSchoolSettings();
  const allTerms = await prisma.academicTerm.findMany({
    where: { academicYear: settings.currentAcademicYear },
    orderBy: { startDate: 'asc' },
  });
  
  const currentIndex = allTerms.findIndex(t => t.id === currentTerm.id);
  const isLastTerm = currentIndex === allTerms.length - 1;
  
  return {
    hasActiveTerm: true,
    currentTerm: {
      id: currentTerm.id,
      name: currentTerm.name,
      type: currentTerm.type,
      startDate: currentTerm.startDate,
      endDate: currentTerm.endDate,
      daysLeft: Math.max(0, daysLeft),
      isEnded,
    },
    isLastTerm,
    academicYear: settings.currentAcademicYear,
    nextAction: isEnded 
      ? (isLastTerm ? 'ADVANCE_ACADEMIC_YEAR' : 'ADVANCE_TERM')
      : 'WAITING',
  };
};
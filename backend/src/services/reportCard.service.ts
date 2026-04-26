import prisma from '../config/prisma.js';

interface ReportCardData {
  id?: string;
  school: any;
  student: any;
  term: any;
  subjects: any[];
  overallAverage: number | null;
  overallPosition: number | null;
  classSize: number;
  overallGrade: string;
  promotionStatus: string | null;
  nextClass: string | null;
  nextTermName: string | null;
  attendance: { present: number; total: number; percentage: number };
  teacherRemarks: string;
  principalRemarks: string;
  nextTermDate: Date | null;
}

export const generateReportCard = async (studentId: string, termId: string): Promise<ReportCardData> => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      guardian: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
  
  if (!student) throw new Error('Student not found');
  
  const term = await prisma.academicTerm.findUnique({ where: { id: termId } });
  if (!term) throw new Error('Term not found');
  
  const school = await prisma.schoolSettings.findFirst();
  
  // Get all students in the class for position calculation
  const classStudents = await prisma.student.findMany({
    where: { classId: student.classId, status: 'ACTIVE' },
    select: { id: true },
  });
  const classSize = classStudents.length;
  
  // Get all subjects for the class
  const classSubjects = await prisma.classSubject.findMany({
    where: { classId: student.classId },
    include: { subject: true },
  });
  
  const subjectReports = [];
  
  for (const cs of classSubjects) {
    // Get exam result
    const examResult = await prisma.examResult.findFirst({
      where: {
        studentId,
        examSubject: { 
          subjectId: cs.subjectId, 
          exam: { termId, isPublished: true }
        },
      },
      include: { 
        examSubject: { 
          include: { 
            exam: true,
            subject: true,
          } 
        } 
      },
    });
    
    // Get assessment scores
    const assessments = await prisma.assessment.findMany({
      where: { 
        subjectId: cs.subjectId, 
        termId,
        classId: student.classId,
      },
      include: {
        type: true,
        scores: { where: { studentId } },
      },
      orderBy: { date: 'asc' },
    });
    
    // Calculate term grade (weighted average)
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    assessments.forEach(assessment => {
      const score = assessment.scores[0];
      if (score?.percentage) {
        const weight = assessment.type.weight;
        totalWeightedScore += score.percentage * weight;
        totalWeight += weight;
      }
    });
    
    // Add exam score (remaining weight)
    if (examResult?.percentage) {
      const examWeight = 100 - totalWeight;
      if (examWeight > 0) {
        totalWeightedScore += examResult.percentage * examWeight;
      }
    }
    
    const termGrade = totalWeight > 0 ? totalWeightedScore / 100 : (examResult?.percentage || null);
    
    subjectReports.push({
      subject: cs.subject.name,
      subjectCode: cs.subject.code,
      examScore: examResult?.percentage || null,
      examGrade: examResult?.grade || null,
      examTotalMarks: examResult?.examSubject?.totalMarks || 100,
      examMarksObtained: examResult?.marksObtained || null,
      assessments: assessments.map(a => ({
        type: a.type.name,
        name: a.name,
        date: a.date,
        score: a.scores[0]?.marksObtained || null,
        total: a.totalMarks,
        percentage: a.scores[0]?.percentage || null,
        weight: a.type.weight,
      })),
      termGrade,
      termRemark: getRemark(termGrade),
      position: null, // Will be calculated later
    });
  }
  
  // Calculate positions for each subject
  const allStudentGrades = await getAllStudentGradesForTerm(student.classId!, termId);
  subjectReports.forEach(subject => {
    if (subject.termGrade) {
      const subjectGrades = allStudentGrades
        .filter(g => g.subjectId === classSubjects.find(cs => cs.subject.name === subject.subject)?.subjectId)
        .sort((a, b) => (b.termGrade || 0) - (a.termGrade || 0));
      
      const position = subjectGrades.findIndex(g => g.studentId === studentId) + 1;
      subject.position = position;
    }
  });
  
  // Calculate overall average
  const validGrades = subjectReports.filter(s => s.termGrade !== null).map(s => s.termGrade!);
  const overallAverage = validGrades.length > 0
    ? validGrades.reduce((a, b) => a + b, 0) / validGrades.length
    : null;
  
  // Calculate overall position
  const studentAverages = allStudentGrades.reduce((acc, g) => {
    if (!acc[g.studentId]) acc[g.studentId] = { total: 0, count: 0 };
    acc[g.studentId].total += (g.termGrade || 0);
    acc[g.studentId].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const averages = Object.entries(studentAverages).map(([id, data]) => ({
    studentId: id,
    average: data.count > 0 ? data.total / data.count : 0,
  }));

  averages.sort((a, b) => b.average - a.average);
  const overallPosition = averages.findIndex(a => a.studentId === studentId) + 1;
  
  // Get attendance summary
  const attendance = await prisma.attendance.findMany({
    where: { 
      studentId, 
      date: { gte: term.startDate, lte: term.endDate } 
    },
  });
  
  const present = attendance.filter(a => a.status === 'PRESENT').length;
  const late = attendance.filter(a => a.status === 'LATE').length;
  const total = attendance.length;
  
  // Get existing report card remarks or use defaults
  const existingReportCard = await prisma.reportCard.findUnique({
    where: { studentId_termId: { studentId, termId } },
  });
  
  // Get promotion status for third term
  let promotionStatus: string | null = null;
  let nextClass: string | null = null;
  let nextTermName: string | null = null;

  if (term.type === 'THIRD_TERM') {
    const promotion = await prisma.studentPromotion.findFirst({
      where: { studentId, termId },
      include: { toClass: true },
    });
    
    if (promotion) {
      promotionStatus = promotion.status;
      nextClass = promotion.toClass?.name || null;
    }

    // Get next academic year's first term
    const [startYear, endYear] = term.academicYear.split('/').map(y => parseInt(y));
    const nextAcademicYear = `${startYear + 1}/${endYear + 1}`;
    
    const nextTerm = await prisma.academicTerm.findFirst({
      where: {
        type: 'FIRST_TERM',
        academicYear: nextAcademicYear,
      },
    });
    nextTermName = nextTerm?.name || null;
  }
  
  // Determine next term date (for reopening)
  const terms = await prisma.academicTerm.findMany({
    orderBy: { startDate: 'asc' },
  });
  const currentTermIndex = terms.findIndex(t => t.id === termId);
  const nextTerm = currentTermIndex >= 0 && currentTermIndex < terms.length - 1 
    ? terms[currentTermIndex + 1] 
    : null;
  
  return {
    id: existingReportCard?.id,
    school: {
      name: school?.schoolName || 'School Name',
      logo: school?.schoolLogo,
      address: school?.schoolAddress,
      phone: school?.schoolPhone,
      email: school?.schoolEmail,
      motto: school?.schoolMotto,
    },
    student: {
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      class: student.class?.name,
      guardian: student.guardian?.name,
      photo: null,
    },
    term: {
      name: term.name,
      type: term.type,
      academicYear: term.academicYear,
    },
    subjects: subjectReports,
    overallAverage,
    overallPosition: overallAverage !== null ? overallPosition : null,
    classSize,
    overallGrade: getRemark(overallAverage),
    promotionStatus,
    nextClass,
    nextTermName,
    attendance: {
      present: present + late,
      total,
      percentage: total > 0 ? ((present + late) / total) * 100 : 0,
    },
    teacherRemarks: existingReportCard?.teacherRemarks || getDefaultTeacherRemark(overallAverage),
    principalRemarks: existingReportCard?.principalRemarks || getDefaultPrincipalRemark(overallAverage),
    nextTermDate: nextTerm?.startDate || null,
  };
};

export const generateClassReportCards = async (classId: string, termId: string) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, admissionNumber: true },
  });
  
  const reportCards = [];
  for (const student of students) {
    try {
      const reportCard = await generateReportCard(student.id, termId);
      reportCards.push(reportCard);
    } catch (error) {
      console.error(`Failed to generate report card for student ${student.id}:`, error);
    }
  }
  
  return reportCards;
};

export const updateRemarks = async (reportCardId: string, data: any) => {
  return prisma.reportCard.update({
    where: { id: reportCardId },
    data: {
      teacherRemarks: data.teacherRemarks,
      principalRemarks: data.principalRemarks,
      updatedBy: data.updatedBy,
    },
  });
};

export const generateReportCardPDF = async (studentId: string, termId: string): Promise<Buffer> => {
  const reportCard = await generateReportCard(studentId, termId);
  const content = JSON.stringify(reportCard, null, 2);
  return Buffer.from(content);
};

// Helper functions
const getRemark = (percentage: number | null): string => {
  if (percentage === null) return 'N/A';
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 70) return 'Very Good';
  if (percentage >= 60) return 'Good';
  if (percentage >= 50) return 'Satisfactory';
  if (percentage >= 40) return 'Pass';
  return 'Needs Improvement';
};

const getDefaultTeacherRemark = (average: number | null): string => {
  if (average === null) return 'Results pending.';
  if (average >= 70) return 'Excellent performance! Keep up the great work.';
  if (average >= 50) return 'Good effort. Continue to work hard.';
  return 'More effort is needed. Please seek help from your teachers.';
};

const getDefaultPrincipalRemark = (average: number | null): string => {
  if (average === null) return 'Promoted to next class.';
  if (average >= 50) return 'Promoted to the next class. Well done!';
  return 'Performance needs significant improvement.';
};

const getAllStudentGradesForTerm = async (classId: string, termId: string) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    include: {
      examResults: {
        where: { examSubject: { exam: { termId } } },
        include: { examSubject: { include: { subject: true } } },
      },
      assessmentScores: {
        where: { assessment: { termId } },
        include: { assessment: { include: { type: true, subject: true } } },
      },
    },
  });
  
  return students.flatMap(student => {
    const subjects = new Set([
      ...student.examResults.map(r => r.examSubject.subjectId),
      ...student.assessmentScores.map(s => s.assessment.subjectId),
    ]);
    
    return Array.from(subjects).map(subjectId => {
      let totalWeighted = 0;
      let totalWeight = 0;
      
      student.assessmentScores
        .filter(s => s.assessment.subjectId === subjectId)
        .forEach(score => {
          if (score.percentage) {
            totalWeighted += score.percentage * score.assessment.type.weight;
            totalWeight += score.assessment.type.weight;
          }
        });
      
      const examResult = student.examResults.find(r => r.examSubject.subjectId === subjectId);
      if (examResult?.percentage && totalWeight < 100) {
        totalWeighted += examResult.percentage * (100 - totalWeight);
      }
      
      const termGrade = totalWeight > 0 ? totalWeighted / 100 : (examResult?.percentage || null);
      
      return { studentId: student.id, subjectId, termGrade };
    });
  });
};
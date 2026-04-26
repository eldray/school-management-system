import prisma from '../config/prisma.js';
import { 
  DashboardStats, 
  StudentReport, 
  EmployeeReport, 
  FinancialReport, 
  AcademicReport, 
  AttendanceReport,
  DateRangeFilter 
} from '../types/reports.js';

// ============================================
// DASHBOARD STATS
// ============================================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Students stats
  const totalStudents = await prisma.student.count();
  const activeStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
  
  const studentsByGender = await prisma.student.groupBy({
    by: ['gender'],
    _count: true,
  });
  
  const maleCount = studentsByGender.find(g => g.gender === 'MALE')?._count || 0;
  const femaleCount = studentsByGender.find(g => g.gender === 'FEMALE')?._count || 0;
  const otherCount = studentsByGender.find(g => g.gender === 'OTHER')?._count || 0;
  
  // Students by class
  const studentsByClass = await prisma.student.groupBy({
    by: ['classId'],
    _count: true,
    where: { status: 'ACTIVE' },
  });
  
  const classNames = await prisma.class.findMany({
    where: { id: { in: studentsByClass.map(s => s.classId).filter(Boolean) as string[] } },
  });
  
  const byClass = studentsByClass
    .filter(s => s.classId)
    .map(s => ({
      className: classNames.find(c => c.id === s.classId)?.name || 'Unknown',
      count: s._count,
    }));
  
  // New students this term
  const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
  let newThisTerm = 0;
  if (activeTerm) {
    newThisTerm = await prisma.student.count({
      where: {
        createdAt: { gte: activeTerm.startDate, lte: activeTerm.endDate },
      },
    });
  }
  
  // Employee stats (unified)
  const totalEmployees = await prisma.employee.count();
  const activeEmployees = await prisma.employee.count({
    where: { user: { isActive: true } },
  });
  
  const employeesByType = await prisma.employee.groupBy({
    by: ['employeeType'],
    _count: true,
  });
  
  const byType: Record<string, number> = {};
  employeesByType.forEach(e => {
    byType[e.employeeType] = e._count;
  });
  
  const employeesByGender = await prisma.employee.findMany({
    include: { user: true },
  });
  
  const empMaleCount = employeesByGender.filter(e => e.user.gender === 'MALE').length;
  const empFemaleCount = employeesByGender.filter(e => e.user.gender === 'FEMALE').length;
  const empOtherCount = employeesByGender.filter(e => e.user.gender === 'OTHER').length;
  
  // Finance stats
  const feeSummaries = await prisma.studentFeeSummary.findMany({
    where: activeTerm ? { termId: activeTerm.id } : {},
  });
  
  const totalExpected = feeSummaries.reduce((sum, s) => sum + s.totalFees, 0);
  const totalCollected = feeSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalOutstanding = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  
  // Academic stats
  const totalExams = await prisma.exam.count();
  const publishedExams = await prisma.exam.count({ where: { isPublished: true } });
  
  // Top performers
  const examResults = await prisma.examResult.findMany({
    include: {
      examSubject: {
        include: {
          subject: true,
          exam: true,
        },
      },
      student: true,
    },
    where: {
      isFinalized: true,
      percentage: { not: null },
    },
    orderBy: { percentage: 'desc' },
    take: 10,
  });
  
  const topPerformers = examResults.map(r => ({
    student: `${r.student.firstName} ${r.student.lastName}`,
    score: r.percentage || 0,
    subject: r.examSubject.subject.name,
  }));
  
  // Attendance stats
  const attendanceRecords = await prisma.attendance.findMany({
    where: activeTerm ? {
      date: { gte: activeTerm.startDate, lte: activeTerm.endDate },
    } : {},
  });
  
  const totalAttendanceRecords = attendanceRecords.length;
  const presentRecords = attendanceRecords.filter(a => a.status === 'PRESENT').length;
  const absentRecords = attendanceRecords.filter(a => a.status === 'ABSENT').length;
  const lateRecords = attendanceRecords.filter(a => a.status === 'LATE').length;
  const averageAttendance = totalAttendanceRecords > 0 
    ? ((presentRecords + lateRecords) / totalAttendanceRecords) * 100 
    : 0;
  
  return {
    students: {
      total: totalStudents,
      active: activeStudents,
      byGender: { male: maleCount, female: femaleCount, other: otherCount },
      byClass,
      newThisTerm,
    },
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      byType,
      byDepartment: [], // Will be populated if needed
      byGender: { male: empMaleCount, female: empFemaleCount, other: empOtherCount },
      byQualification: [], // Will be populated
    },
    finances: {
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionRate,
      byTerm: [], // Will be populated
      recentPayments: [], // Will be populated
    },
    academics: {
      totalExams,
      publishedExams,
      averagePerformance: 0,
      bySubject: [],
      topPerformers: topPerformers.slice(0, 5),
    },
    attendance: {
      averageAttendance,
      byClass: [],
      recentTrend: [],
    },
    // Legacy support
    teachers: {
      total: employeesByType['TEACHER'] || 0,
      active: activeEmployees,
      byQualification: [],
      bySubject: [],
      classTeachers: 0,
      subjectTeachers: employeesByType['TEACHER'] || 0,
      teacherWorkload: [],
      recentJoiners: [],
    },
  };
};

// ============================================
// EMPLOYEE REPORT
// ============================================

export const getEmployeeReport = async (filters?: { employeeType?: string; department?: string }): Promise<EmployeeReport> => {
  const where: any = {};
  if (filters?.employeeType) where.employeeType = filters.employeeType;
  if (filters?.department) where.department = filters.department;
  
  const employees = await prisma.employee.findMany({
    where,
    include: {
      user: true,
      teacherClasses: true,
      teacherSubjects: { include: { subject: true, class: true } },
    },
  });
  
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.user.isActive).length;
  
  const byType: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};
  const byQualification: Record<string, number> = {};
  
  employees.forEach(e => {
    byType[e.employeeType] = (byType[e.employeeType] || 0) + 1;
    if (e.department) byDepartment[e.department] = (byDepartment[e.department] || 0) + 1;
    if (e.qualification) byQualification[e.qualification] = (byQualification[e.qualification] || 0) + 1;
  });
  
  const byGender = {
    male: employees.filter(e => e.user.gender === 'MALE').length,
    female: employees.filter(e => e.user.gender === 'FEMALE').length,
    other: employees.filter(e => e.user.gender === 'OTHER').length,
  };
  
  const teacherStats = {
    classTeachers: employees.filter(e => e.employeeType === 'TEACHER' && e.teacherClasses.length > 0).length,
    subjectTeachers: employees.filter(e => e.employeeType === 'TEACHER' && e.teacherSubjects.length > 0).length,
    averageClassesPerTeacher: 0,
    averageStudentsPerTeacher: 0,
    bySubject: [],
  };
  
  return {
    summary: {
      totalEmployees,
      activeEmployees,
      byType,
      byDepartment: Object.entries(byDepartment).map(([department, count]) => ({ department, count })),
      byGender,
      byQualification: Object.entries(byQualification).map(([qualification, count]) => ({ qualification, count })),
      teacherStats,
    },
    workload: employees.map(e => ({
      employeeId: e.id,
      name: `${e.user.firstName} ${e.user.lastName}`,
      employeeType: e.employeeType,
      department: e.department || '',
      position: e.position || '',
      qualification: e.qualification || '',
      classesCount: e.teacherClasses.length,
      subjectsCount: e.teacherSubjects.length,
      studentsCount: e.teacherClasses.reduce((sum, c) => sum + (c as any)._count?.students || 0, 0),
      isClassTeacher: e.teacherClasses.length > 0,
      classesList: e.teacherClasses.map(c => ({ id: c.id, name: c.name, gradeLevel: c.gradeLevel, studentCount: 0 })),
      subjectsList: e.teacherSubjects.map(ts => ({ id: ts.subjectId, name: ts.subject.name, classes: [ts.class.name] })),
    })),
    details: employees.map(e => ({
      id: e.id,
      employeeId: e.employeeId,
      name: `${e.user.firstName} ${e.user.lastName}`,
      email: e.user.email,
      phone: e.user.phone || '',
      employeeType: e.employeeType,
      department: e.department || '',
      position: e.position || '',
      qualification: e.qualification || '',
      subjects: e.subjects,
      joinDate: e.joinDate.toISOString(),
      isActive: e.user.isActive,
      lastLogin: e.user.lastLogin?.toISOString(),
      classes: e.teacherClasses.map(c => ({ id: c.id, name: c.name, gradeLevel: c.gradeLevel, studentCount: 0 })),
      totalStudents: e.teacherClasses.reduce((sum, c) => sum + (c as any)._count?.students || 0, 0),
      salary: e.salary || 0,
      bankAccount: e.bankAccount || '',
    })),
  };
};

// ============================================
// FINANCIAL REPORT
// ============================================

export const getDetailedFinancialReport = async (filters?: {
  termId?: string;
  classId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const where: any = {};
  if (filters?.termId) where.termId = filters.termId;
  if (filters?.classId) where.student = { classId: filters.classId };
  if (filters?.startDate) where.paymentDate = { gte: filters.startDate };
  if (filters?.endDate) where.paymentDate = { ...where.paymentDate, lte: filters.endDate };
  
  const payments = await prisma.payment.findMany({
    where,
    include: {
      student: { include: { class: true } },
      feeStructure: { include: { feeType: true, term: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });
  
  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  
  // Get expected totals
  const feeStructures = await prisma.feeStructure.findMany({
    where: filters?.termId ? { termId: filters.termId } : {},
    include: { student: true, feeType: true },
  });
  
  const totalExpected = feeStructures.reduce((sum, fs) => sum + fs.amount, 0);
  const totalOutstanding = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  
  // By fee type
  const byFeeTypeMap = new Map();
  feeStructures.forEach(fs => {
    const key = fs.feeType.id;
    if (!byFeeTypeMap.has(key)) {
      byFeeTypeMap.set(key, {
        type: fs.feeType.name,
        category: fs.feeType.category,
        expected: 0,
        collected: 0,
      });
    }
    const item = byFeeTypeMap.get(key);
    item.expected += fs.amount;
  });
  
  payments.forEach(p => {
    const key = p.feeStructure.feeType.id;
    if (byFeeTypeMap.has(key)) {
      byFeeTypeMap.get(key).collected += p.amountPaid;
    }
  });
  
  const byFeeType = Array.from(byFeeTypeMap.values());
  
  // By class
  const byClassMap = new Map();
  feeStructures.forEach(fs => {
    if (fs.student?.classId) {
      const key = fs.student.classId;
      if (!byClassMap.has(key)) {
        byClassMap.set(key, {
          class: fs.student.class?.name || 'Unknown',
          expected: 0,
          collected: 0,
        });
      }
      byClassMap.get(key).expected += fs.amount;
    }
  });
  
  payments.forEach(p => {
    if (p.student.classId && byClassMap.has(p.student.classId)) {
      byClassMap.get(p.student.classId).collected += p.amountPaid;
    }
  });
  
  const byClass = Array.from(byClassMap.values()).map(c => ({
    ...c,
    rate: c.expected > 0 ? (c.collected / c.expected) * 100 : 0,
  }));
  
  // Daily trend
  const dailyTrendMap = new Map();
  payments.forEach(p => {
    const date = p.paymentDate.toISOString().split('T')[0];
    dailyTrendMap.set(date, (dailyTrendMap.get(date) || 0) + p.amountPaid);
  });
  
  const dailyTrend = Array.from(dailyTrendMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
  
  // Outstanding students
  const studentFeeMap = new Map();
  feeStructures.forEach(fs => {
    if (fs.studentId) {
      if (!studentFeeMap.has(fs.studentId)) {
        studentFeeMap.set(fs.studentId, { total: 0, paid: 0 });
      }
      studentFeeMap.get(fs.studentId).total += fs.amount;
    }
  });
  
  payments.forEach(p => {
    if (studentFeeMap.has(p.studentId)) {
      studentFeeMap.get(p.studentId).paid += p.amountPaid;
    }
  });
  
  const outstandingList = Array.from(studentFeeMap.entries())
    .filter(([_, data]) => data.total - data.paid > 0)
    .map(([studentId, data]) => {
      const student = feeStructures.find(fs => fs.studentId === studentId)?.student;
      return {
        student: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        admissionNumber: student?.admissionNumber || '',
        class: student?.class?.name || 'Unknown',
        totalFees: data.total,
        totalPaid: data.paid,
        totalDue: data.total - data.paid,
      };
    });
  
  // Recent transactions
  const recentTransactions = payments.slice(0, 20).map(p => ({
    id: p.id,
    receiptNumber: p.receiptNumber,
    student: `${p.student.firstName} ${p.student.lastName}`,
    class: p.student.class?.name || 'N/A',
    feeType: p.feeStructure.feeType.name,
    amount: p.amountPaid,
    date: p.paymentDate.toISOString(),
    method: p.paymentMethod,
  }));
  
  return {
    summary: {
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionRate,
      byFeeType,
      byClass,
      byTerm: [],
      byPaymentMethod: [],
    },
    dailyTrend,
    recentTransactions,
    outstandingList,
  };
};

// ============================================
// ATTENDANCE REPORT
// ============================================

export const getDetailedAttendanceStats = async (filters?: {
  classId?: string;
  termId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  let dateFilter: any = {};
  
  if (filters?.startDate) dateFilter.gte = filters.startDate;
  if (filters?.endDate) dateFilter.lte = filters.endDate;
  
  if (filters?.termId) {
    const term = await prisma.academicTerm.findUnique({ where: { id: filters.termId } });
    if (term) {
      dateFilter = { gte: term.startDate, lte: term.endDate };
    }
  }
  
  const where: any = {};
  if (Object.keys(dateFilter).length) where.date = dateFilter;
  
  const attendanceRecords = await prisma.attendance.findMany({
    where,
    include: { student: true },
  });
  
  // Filter by class if needed
  let filteredRecords = attendanceRecords;
  if (filters?.classId) {
    filteredRecords = attendanceRecords.filter(a => a.student.classId === filters.classId);
  }
  
  const totalRecords = filteredRecords.length;
  const presentRecords = filteredRecords.filter(a => a.status === 'PRESENT').length;
  const absentRecords = filteredRecords.filter(a => a.status === 'ABSENT').length;
  const lateRecords = filteredRecords.filter(a => a.status === 'LATE').length;
  const overallRate = totalRecords > 0 ? ((presentRecords + lateRecords) / totalRecords) * 100 : 0;
  
  const totalStudents = new Set(filteredRecords.map(a => a.studentId)).size;
  
  // By class
  const byClassMap = new Map();
  filteredRecords.forEach(record => {
    const className = record.student.class?.name || 'Unknown';
    if (!byClassMap.has(className)) {
      byClassMap.set(className, { present: 0, absent: 0, late: 0, total: 0 });
    }
    const stats = byClassMap.get(className);
    stats[record.status.toLowerCase() === 'present' ? 'present' : 
          record.status.toLowerCase() === 'absent' ? 'absent' : 'late']++;
    stats.total++;
  });
  
  const byClass = Array.from(byClassMap.entries()).map(([className, stats]) => ({
    classId: '',
    className,
    present: stats.present,
    absent: stats.absent,
    late: stats.late,
    total: stats.total,
    rate: stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0,
  }));
  
  // By day
  const byDayMap = new Map();
  filteredRecords.forEach(record => {
    const date = record.date.toISOString().split('T')[0];
    if (!byDayMap.has(date)) {
      byDayMap.set(date, { present: 0, absent: 0, late: 0, total: 0 });
    }
    const stats = byDayMap.get(date);
    stats[record.status.toLowerCase() === 'present' ? 'present' : 
          record.status.toLowerCase() === 'absent' ? 'absent' : 'late']++;
    stats.total++;
  });
  
  const byDay = Array.from(byDayMap.entries())
    .map(([date, stats]) => ({
      date,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      total: stats.total,
      rate: stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Low attendance students
  const studentAttendanceMap = new Map();
  filteredRecords.forEach(record => {
    if (!studentAttendanceMap.has(record.studentId)) {
      studentAttendanceMap.set(record.studentId, { present: 0, absent: 0, late: 0, total: 0 });
    }
    const stats = studentAttendanceMap.get(record.studentId);
    stats[record.status.toLowerCase() === 'present' ? 'present' : 
          record.status.toLowerCase() === 'absent' ? 'absent' : 'late']++;
    stats.total++;
  });
  
  const lowAttendanceStudents = Array.from(studentAttendanceMap.entries())
    .map(([studentId, stats]) => {
      const student = filteredRecords.find(a => a.studentId === studentId)?.student;
      const rate = stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0;
      return {
        student: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        class: student?.class?.name || 'Unknown',
        admissionNumber: student?.admissionNumber || '',
        attendanceRate: rate,
        daysPresent: stats.present,
        daysAbsent: stats.absent,
        totalDays: stats.total,
      };
    })
    .filter(s => s.attendanceRate < 75)
    .sort((a, b) => a.attendanceRate - b.attendanceRate);
  
  return {
    summary: {
      overallRate,
      totalRecords,
      presentRecords,
      absentRecords,
      lateRecords,
      totalStudents,
    },
    byClass,
    byDay,
    lowAttendanceStudents,
  };
};
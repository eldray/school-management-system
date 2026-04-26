import prisma from '../config/prisma.js';
import { AttendanceStatus } from '@prisma/client';

export interface MarkAttendanceInput {
  studentId: string;
  date: Date;
  status: AttendanceStatus;
}

export interface BulkAttendanceInput {
  classId: string;
  date: Date;
  records: {
    studentId: string;
    status: AttendanceStatus;
  }[];
}

// Mark single student attendance
export const markAttendance = async (data: MarkAttendanceInput) => {
  return prisma.attendance.upsert({
    where: {
      studentId_date: {
        studentId: data.studentId,
        date: new Date(data.date),
      },
    },
    update: { status: data.status },
    create: {
      studentId: data.studentId,
      date: new Date(data.date),
      status: data.status,
    },
    include: { student: true },
  });
};

// Bulk mark attendance for a class
export const markBulkAttendance = async (data: BulkAttendanceInput) => {
  const results = [];
  
  for (const record of data.records) {
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: record.studentId,
          date: new Date(data.date),
        },
      },
      update: { status: record.status },
      create: {
        studentId: record.studentId,
        date: new Date(data.date),
        status: record.status,
      },
    });
    results.push(attendance);
  }
  
  return results;
};

// Get class attendance for a specific date
export const getClassAttendance = async (classId: string, date: Date) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    include: {
      attendances: {
        where: { date: new Date(date) },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return students.map(student => ({
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
    },
    attendance: student.attendances[0] || null,
  }));
};

// Get student attendance history
export const getStudentAttendance = async (studentId: string, startDate?: Date, endDate?: Date) => {
  const where: any = { studentId };
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  return prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { student: true },
  });
};

// Get attendance statistics for a student
export const getStudentAttendanceStats = async (studentId: string, termId?: string) => {
  let dateFilter: any = {};
  
  if (termId) {
    const term = await prisma.academicTerm.findUnique({ where: { id: termId } });
    if (term) {
      dateFilter = {
        gte: term.startDate,
        lte: term.endDate,
      };
    }
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      date: dateFilter,
    },
  });

  const total = attendances.length;
  const present = attendances.filter(a => a.status === 'PRESENT').length;
  const absent = attendances.filter(a => a.status === 'ABSENT').length;
  const late = attendances.filter(a => a.status === 'LATE').length;

  return {
    total,
    present,
    absent,
    late,
    attendanceRate: total > 0 ? ((present + late) / total) * 100 : 0,
  };
};

// Get class attendance statistics
export const getClassAttendanceStats = async (classId: string, startDate?: Date, endDate?: Date) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
  });

  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const stats = [];
  
  for (const student of students) {
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: dateFilter,
      },
    });

    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const late = attendances.filter(a => a.status === 'LATE').length;

    stats.push({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
      },
      total,
      present,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late,
      attendanceRate: total > 0 ? ((present + late) / total) * 100 : 0,
    });
  }

  return stats;
};

// Get attendance summary by date range
export const getAttendanceSummary = async (classId?: string, startDate?: Date, endDate?: Date) => {
  const where: any = {};
  
  if (classId) {
    where.student = { classId };
  }
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const attendances = await prisma.attendance.groupBy({
    by: ['date', 'status'],
    where,
    _count: true,
    orderBy: { date: 'asc' },
  });

  // Group by date
  const byDate: Record<string, { present: number; absent: number; late: number }> = {};
  
  attendances.forEach(a => {
    const dateStr = a.date.toISOString().split('T')[0];
    if (!byDate[dateStr]) {
      byDate[dateStr] = { present: 0, absent: 0, late: 0 };
    }
    if (a.status === 'PRESENT') byDate[dateStr].present = a._count;
    if (a.status === 'ABSENT') byDate[dateStr].absent = a._count;
    if (a.status === 'LATE') byDate[dateStr].late = a._count;
  });

  return Object.entries(byDate).map(([date, counts]) => ({
    date,
    ...counts,
    total: counts.present + counts.absent + counts.late,
    rate: ((counts.present + counts.late) / (counts.present + counts.absent + counts.late)) * 100,
  }));
};

// Check if teacher can mark attendance for a class
export const canTeacherMarkAttendance = async (teacherUserId: string, classId: string): Promise<boolean> => {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { id: teacherUserId } },
    include: {
      classes: true, // ONLY class teacher can mark attendance
    },
  });
  
  if (!teacher) return false;
  
  const isUnassigned = teacher.classes.length === 0 && teacher.teacherSubjects.length === 0;
  
  // Unassigned teachers CANNOT mark attendance
  if (isUnassigned) return false;
  
  // ONLY class teachers can mark attendance (not subject teachers)
  return teacher.classes.some(c => c.id === classId);
};

// Check if teacher can VIEW attendance (not mark)
export const canTeacherViewAttendance = async (teacherUserId: string, classId: string): Promise<boolean> => {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { id: teacherUserId } },
    include: {
      classes: true,
      teacherSubjects: { where: { classId } },
    },
  });
  
  if (!teacher) return false;
  
  const isUnassigned = teacher.classes.length === 0 && teacher.teacherSubjects.length === 0;
  
  // Unassigned teachers can SEE class names but NOT attendance records
  // They cannot view attendance details
  if (isUnassigned) return false;
  
  const isClassTeacher = teacher.classes.some(c => c.id === classId);
  const teachesSubject = teacher.teacherSubjects.some(ts => ts.classId === classId);
  
  return isClassTeacher || teachesSubject;
};

// Get classes a teacher can see (just names for unassigned)
export const getTeacherVisibleClasses = async (teacherUserId: string) => {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { id: teacherUserId } },
    include: {
      classes: true,
      teacherSubjects: {
        include: { class: true },
      },
    },
  });
  
  if (!teacher) return [];
  
  const isUnassigned = teacher.classes.length === 0 && teacher.teacherSubjects.length === 0;
  
  // Unassigned teachers - return ALL classes but with viewOnly flag
  if (isUnassigned) {
    const allClasses = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        stream: true,
        // DO NOT include students list
      },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });
    
    return allClasses.map(c => ({
      ...c,
      accessType: 'VIEW_ONLY',
      canMarkAttendance: false,
      canEnterResults: false,
      canViewStudents: false,
    }));
  }
  
  // Assigned teachers - return classes with full access
  const classMap = new Map();
  
  teacher.classes.forEach(c => {
    classMap.set(c.id, { accessType: 'CLASS_TEACHER', canMarkAttendance: true, canEnterResults: true, canViewStudents: true });
  });
  
  teacher.teacherSubjects.forEach(ts => {
    if (!classMap.has(ts.class.id)) {
      classMap.set(ts.class.id, { accessType: 'SUBJECT_TEACHER', canMarkAttendance: false, canEnterResults: true, canViewStudents: true });
    }
  });
  
  const classIds = Array.from(classMap.keys());
  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      stream: true,
      teacherProfile: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  
  return classes.map(cls => ({
    ...cls,
    ...classMap.get(cls.id),
  }));
};
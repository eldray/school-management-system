// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  students: {
    total: number;
    active: number;
    byGender: { male: number; female: number; other: number };
    byClass: { className: string; count: number }[];
    newThisTerm: number;
  };
  employees: {  // Unified - replaces teachers
    total: number;
    active: number;
    byType: { 
      TEACHER?: number; 
      ACCOUNTANT?: number; 
      ADMIN_STAFF?: number;
      CANTEEN?: number;
      LIBRARIAN?: number;
      LAB_ASSISTANT?: number;
      SECURITY?: number;
      CLEANER?: number;
      DRIVER?: number;
      OTHER?: number;
    };
    byDepartment: { department: string; count: number }[];
    byGender: { male: number; female: number; other: number };
    byQualification: { qualification: string; count: number }[];
  };
  finances: {
    totalExpected: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    byTerm: { termName: string; collected: number; expected: number }[];
    recentPayments: { date: string; amount: number }[];
  };
  academics: {
    totalExams: number;
    publishedExams: number;
    averagePerformance: number;
    bySubject: { subject: string; averageScore: number }[];
    topPerformers: { student: string; score: number; subject: string }[];
  };
  attendance: {
    averageAttendance: number;
    byClass: { className: string; rate: number }[];
    recentTrend: { date: string; rate: number }[];
  };
  // Legacy support - kept for backward compatibility
  teachers?: {
    total: number;
    active: number;
    byQualification: { qualification: string; count: number }[];
    bySubject: { subject: string; count: number }[];
    classTeachers: number;
    subjectTeachers: number;
    teacherWorkload: {
      teacher: string;
      classes: number;
      subjects: number;
      students: number;
      qualification: string;
    }[];
    recentJoiners: {
      name: string;
      qualification: string;
      joinDate: string;
    }[];
  };
}

// ============================================
// EMPLOYEE REPORT (Unified - replaces TeacherReport)
// ============================================

export interface EmployeeReport {
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    byType: {
      TEACHER: number;
      ACCOUNTANT: number;
      ADMIN_STAFF: number;
      CANTEEN: number;
      LIBRARIAN: number;
      LAB_ASSISTANT: number;
      SECURITY: number;
      CLEANER: number;
      DRIVER: number;
      OTHER: number;
    };
    byDepartment: { department: string; count: number }[];
    byGender: { male: number; female: number; other: number };
    byQualification: { qualification: string; count: number }[];
    // Teacher-specific stats (for backward compatibility)
    teacherStats?: {
      classTeachers: number;
      subjectTeachers: number;
      averageClassesPerTeacher: number;
      averageStudentsPerTeacher: number;
      bySubject: { subject: string; count: number }[];
    };
  };
  workload: {
    employeeId: string;
    name: string;
    employeeType: string;
    department: string;
    position: string;
    qualification: string;
    // For teachers
    classesCount: number;
    subjectsCount: number;
    studentsCount: number;
    isClassTeacher: boolean;
    classesList: { id: string; name: string; gradeLevel: number; studentCount: number }[];
    subjectsList: { id: string; name: string; classes: string[] }[];
  }[];
  details: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    phone?: string;
    employeeType: string;
    department: string;
    position: string;
    qualification: string;
    subjects: string[];
    joinDate: string;
    isActive: boolean;
    lastLogin?: string;
    // For teachers
    classes?: { id: string; name: string; gradeLevel: number; studentCount: number }[];
    totalStudents?: number;
    salary?: number;
    bankAccount?: string;
  }[];
}

// ============================================
// STUDENT REPORT
// ============================================

export interface StudentReport {
  summary: {
    totalStudents: number;
    activeStudents: number;
    graduated: number;
    suspended: number;
    genderDistribution: { male: number; female: number; other: number };
    classDistribution: { class: string; count: number; percentage: number }[];
  };
  details: {
    id: string;
    name: string;
    admissionNumber: string;
    class: string;
    status: string;
    feesPaid: number;
    feesDue: number;
    attendanceRate: number;
    averageScore: number;
  }[];
}

// ============================================
// FINANCIAL REPORT
// ============================================

export interface FinancialReport {
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    byFeeType: { type: string; category: string; expected: number; collected: number }[];
    byClass: { class: string; expected: number; collected: number; rate: number }[];
    byTerm: { term: string; expected: number; collected: number; rate: number }[];
    byPaymentMethod: { method: string; amount: number; count: number }[];
  };
  dailyTrend: { date: string; amount: number }[];
  recentTransactions: {
    id: string;
    receiptNumber: string;
    student: string;
    class: string;
    feeType: string;
    amount: number;
    date: string;
    method: string;
  }[];
  outstandingList: {
    student: string;
    admissionNumber: string;
    class: string;
    totalFees: number;
    totalPaid: number;
    totalDue: number;
    lastPayment?: string;
  }[];
}

// ============================================
// ACADEMIC REPORT
// ============================================

export interface AcademicReport {
  summary: {
    totalExams: number;
    publishedExams: number;
    overallAverage: number;
    passRate: number;
    bySubject: { subject: string; average: number; passRate: number; students: number }[];
    byClass: { class: string; average: number; passRate: number }[];
    gradeDistribution: { grade: string; count: number; percentage: number }[];
  };
  topPerformers: {
    student: string;
    class: string;
    averageScore: number;
    examsTaken: number;
  }[];
  subjectsNeedingAttention: {
    subject: string;
    class: string;
    averageScore: number;
    passRate: number;
  }[];
}

// ============================================
// ATTENDANCE REPORT
// ============================================

export interface AttendanceReport {
  summary: {
    overallRate: number;
    totalRecords: number;
    presentRecords: number;
    absentRecords: number;
    lateRecords: number;
    totalStudents: number;
  };
  byClass: {
    classId: string;
    className: string;
    present: number;
    absent: number;
    late: number;
    total: number;
    rate: number;
  }[];
  byDay: {
    date: string;
    present: number;
    absent: number;
    late: number;
    total: number;
    rate: number;
  }[];
  lowAttendanceStudents: {
    student: string;
    class: string;
    admissionNumber: string;
    attendanceRate: number;
    daysPresent: number;
    daysAbsent: number;
    totalDays: number;
  }[];
}

// ============================================
// FILTERS
// ============================================

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
  termId?: string;
  classId?: string;
}
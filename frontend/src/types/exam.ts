export interface AcademicTerm {
  id: string;
  name: string;
  type: 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count?: { exams: number };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
}

export interface ExamSubject {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime?: string;
  duration?: number;
  totalMarks: number;
  passingMarks: number;
  class?: { id: string; name: string };
  subject?: Subject;
  _count?: { results: number };
}

export interface Exam {
  id: string;
  name: string;
  type: 'MID_TERM' | 'END_OF_TERM' | 'MOCK' | 'FINAL';
  termId: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  term?: AcademicTerm;
  examSubjects?: ExamSubject[];
  _count?: { examSubjects: number; results: number };
}

export interface ExamResult {
  id: string;
  examSubjectId: string;
  studentId: string;
  marksObtained?: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
  isAbsent: boolean;
  isFinalized: boolean;
  student?: { id: string; firstName: string; lastName: string; admissionNumber: string };
  examSubject?: ExamSubject & { subject: Subject; exam: Exam };
}

export interface CreateExamInput {
  name: string;
  type: string;
  termId: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  subjects: {
    classId: string;
    subjectId: string;
    examDate: string;
    startTime?: string;
    duration?: number;
    totalMarks?: number;
    passingMarks?: number;
  }[];
}
// frontend/src/types/class.ts

export interface Class {
  id: string;
  name: string;
  gradeLevel: number;
  stream?: string;
  teacherProfileId?: string;
  teacherProfile?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  studentCount: number;
  subjectCount?: number;
  subjects?: Subject[];
  classSubjects?: ClassSubject[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  subject: Subject;
  teacherSubjects?: TeacherSubject[];
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  teacher: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  subject: Subject;
  class: Class;
}

export interface CreateClassData {
  name: string;
  gradeLevel: number;
  stream?: string;
  teacherProfileId?: string;
}

export interface UpdateClassData {
  name?: string;
  gradeLevel?: number;
  stream?: string;
  teacherProfileId?: string;
}
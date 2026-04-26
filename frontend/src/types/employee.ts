import { EmployeeType, User } from './user';

export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  employeeType: EmployeeType;
  department?: string;
  position?: string;
  qualification?: string;
  subjects: string[];
  salary?: number;
  bankAccount?: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  teacherClasses: EmployeeClass[];
  teacherSubjects: EmployeeSubject[];
}

export interface EmployeeClass {
  id: string;
  name: string;
  gradeLevel: number;
  stream?: string;
  studentCount: number;
}

export interface EmployeeSubject {
  id: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  classId: string;
  class: {
    id: string;
    name: string;
  };
}

export interface CreateEmployeeData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId?: string;
  employeeType: EmployeeType;
  department?: string;
  position?: string;
  qualification?: string;
  subjects: string[];
  salary?: number;
  bankAccount?: string;
  joinDate: string;
  subjectAssignments?: {
    subjectId: string;
    classId: string;
  }[];
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
  employeeType?: EmployeeType;
  department?: string;
  position?: string;
  qualification?: string;
  subjects?: string[];
  salary?: number;
  bankAccount?: string;
  subjectAssignments?: {
    subjectId: string;
    classId: string;
  }[];
}
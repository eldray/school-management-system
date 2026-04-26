export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  // Unified employee relation (replaces teacher/accountant/staff)
  employee?: EmployeeProfile;
  // Legacy fields for backward compatibility (kept temporarily)
  teacherProfile?: TeacherProfile;
  parentProfile?: ParentProfile;
  studentProfile?: StudentProfile;
  accountantProfile?: AccountantProfile;
  // Role-specific IDs from JWT
  studentId?: string;
  employeeId?: string;
  employeeType?: string;
  teacherId?: string;
  accountantId?: string;
  parentId?: string;
  studentIds?: string[];
}

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'EMPLOYEE'        // New unified role
  | 'TEACHER'         // Legacy (kept for backward compatibility)
  | 'ACCOUNTANT'      // Legacy (kept for backward compatibility)
  | 'PARENT'
  | 'STUDENT'
  | 'CANTEEN';

// New unified Employee Profile
export interface EmployeeProfile {
  id: string;
  employeeId: string;
  employeeType: EmployeeType;
  department?: string;
  position?: string;
  qualification?: string;
  subjects: string[];
  salary?: number;
  bankAccount?: string;
  joinDate: string;
}

export type EmployeeType = 
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'ADMIN_STAFF'
  | 'CANTEEN'
  | 'LIBRARIAN'
  | 'LAB_ASSISTANT'
  | 'SECURITY'
  | 'CLEANER'
  | 'DRIVER'
  | 'OTHER';

// Legacy types (kept for backward compatibility)
export interface TeacherProfile {
  id: string;
  employeeId: string;
  qualification: string;
  subjects: string[];
}

export interface ParentProfile {
  id: string;
  occupation?: string;
  relationship: string;
}

export interface StudentProfile {
  id: string;
  admissionNumber: string;
  class?: {
    id: string;
    name: string;
  };
}

export interface AccountantProfile {
  id: string;
  employeeId: string;
  department: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  employeeType?: EmployeeType;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string;
  password?: string;
  isActive?: boolean;
  employeeType?: EmployeeType;
  department?: string;
  position?: string;
  qualification?: string;
  subjects?: string[];
  salary?: number;
  bankAccount?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  data: User;
}
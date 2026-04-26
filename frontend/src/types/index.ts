export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
  };
  guardian?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  classId?: string;  // Add this field
  guardian: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
}
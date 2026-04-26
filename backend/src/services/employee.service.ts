import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { EmployeeType } from '@prisma/client';

export interface CreateEmployeeInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId: string;
  employeeType: EmployeeType;
  department?: string;
  position?: string;
  qualification?: string;
  subjects?: string[];
  salary?: number;
  bankAccount?: string;
  joinDate?: Date;
}

export interface UpdateEmployeeInput {
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
}

// Generate employee ID
const generateEmployeeId = async (type: EmployeeType): Promise<string> => {
  const prefix = {
    TEACHER: 'TCH',
    ACCOUNTANT: 'ACC',
    ADMIN_STAFF: 'ADM',
    CANTEEN: 'CTN',
    LIBRARIAN: 'LIB',
    LAB_ASSISTANT: 'LAB',
    SECURITY: 'SEC',
    CLEANER: 'CLN',
    DRIVER: 'DRV',
    OTHER: 'OTH',
  }[type];

  const year = new Date().getFullYear().toString().slice(-2);
  const count = await prisma.employee.count({
    where: { employeeType: type },
  });
  
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const createEmployee = async (data: CreateEmployeeInput) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Check if employee ID already exists
  if (data.employeeId) {
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId: data.employeeId },
    });
    if (existingEmployee) {
      throw new Error('Employee with this ID already exists');
    }
  }

  const employeeId = data.employeeId || await generateEmployeeId(data.employeeType);
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const employee = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'EMPLOYEE',
        isActive: true,
      },
    });

    // Create employee profile
    const employee = await tx.employee.create({
      data: {
        userId: user.id,
        employeeId,
        employeeType: data.employeeType,
        department: data.department,
        position: data.position,
        qualification: data.qualification,
        subjects: data.subjects || [],
        salary: data.salary,
        bankAccount: data.bankAccount,
        joinDate: data.joinDate || new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
        },
      },
    });

    return employee;
  });

  return employee;
};

export const getAllEmployees = async (filters?: { 
  employeeType?: string; 
  isActive?: boolean;
  department?: string;
}) => {
  const whereClause: any = {};

  if (filters?.employeeType) {
    whereClause.employeeType = filters.employeeType;
  }
  if (filters?.department) {
    whereClause.department = filters.department;
  }
  if (filters?.isActive !== undefined) {
    whereClause.user = { isActive: filters.isActive };
  }

  const employees = await prisma.employee.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      teacherClasses: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          stream: true,
          _count: {
            select: { students: true },
          },
        },
      },
      teacherSubjects: {
        include: {
          subject: true,
          class: true,
        },
      },
    },
    orderBy: {
      user: {
        lastName: 'asc',
      },
    },
  });

  // Add computed fields
  return employees.map(emp => ({
    ...emp,
    totalStudents: emp.teacherClasses.reduce((sum, cls) => sum + cls._count.students, 0),
    classCount: emp.teacherClasses.length,
    isTeacher: emp.employeeType === 'TEACHER',
  }));
};

export const getEmployeeById = async (id: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      teacherClasses: {
        include: {
          students: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
              gender: true,
              guardian: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
            orderBy: [
              { lastName: 'asc' },
              { firstName: 'asc' },
            ],
          },
        },
      },
      teacherSubjects: {
        include: {
          subject: true,
          class: true,
        },
      },
    },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  return {
    ...employee,
    totalStudents: employee.teacherClasses.reduce((sum, cls) => sum + cls.students.length, 0),
  };
};

export const updateEmployee = async (id: string, data: UpdateEmployeeInput) => {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Update user data
  const userUpdate: any = {};
  if (data.firstName) userUpdate.firstName = data.firstName;
  if (data.lastName) userUpdate.lastName = data.lastName;
  if (data.phone !== undefined) userUpdate.phone = data.phone;
  if (data.isActive !== undefined) userUpdate.isActive = data.isActive;

  // Update employee data
  const employeeUpdate: any = {};
  if (data.employeeType) employeeUpdate.employeeType = data.employeeType;
  if (data.department !== undefined) employeeUpdate.department = data.department;
  if (data.position !== undefined) employeeUpdate.position = data.position;
  if (data.qualification !== undefined) employeeUpdate.qualification = data.qualification;
  if (data.subjects !== undefined) employeeUpdate.subjects = data.subjects;
  if (data.salary !== undefined) employeeUpdate.salary = data.salary;
  if (data.bankAccount !== undefined) employeeUpdate.bankAccount = data.bankAccount;

  const updatedEmployee = await prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({
        where: { id: employee.userId },
        data: userUpdate,
      });
    }

    if (Object.keys(employeeUpdate).length > 0) {
      await tx.employee.update({
        where: { id },
        data: employeeUpdate,
      });
    }

    return await tx.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        },
        teacherClasses: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            stream: true,
          },
        },
        teacherSubjects: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });
  });

  return updatedEmployee;
};

export const deleteEmployee = async (id: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      teacherClasses: true,
      teacherSubjects: true,
    },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (employee.teacherClasses.length > 0) {
    throw new Error('Cannot delete employee with assigned classes. Please reassign classes first.');
  }

  // Delete teacher subjects
  await prisma.teacherSubject.deleteMany({
    where: { teacherId: id },
  });

  // Soft delete - deactivate user
  await prisma.user.update({
    where: { id: employee.userId },
    data: { isActive: false },
  });
};

export const activateEmployee = async (id: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  await prisma.user.update({
    where: { id: employee.userId },
    data: { isActive: true },
  });

  return getEmployeeById(id);
};

export const getEmployeeClasses = async (employeeId: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      teacherClasses: {
        include: {
          _count: {
            select: { students: true },
          },
        },
        orderBy: [
          { gradeLevel: 'asc' },
          { name: 'asc' },
        ],
      },
    },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  return employee.teacherClasses.map(cls => ({
    ...cls,
    studentCount: cls._count.students,
  }));
};

export const getEmployeeStatistics = async () => {
  const totalEmployees = await prisma.employee.count();
  
  const activeEmployees = await prisma.employee.count({
    where: { user: { isActive: true } },
  });

  const teachersWithClasses = await prisma.employee.count({
    where: {
      employeeType: 'TEACHER',
      teacherClasses: { some: {} },
    },
  });

  const allEmployees = await prisma.employee.findMany({
    include: {
      teacherClasses: {
        include: {
          _count: { select: { students: true } },
        },
      },
      teacherSubjects: {
        include: { subject: true },
      },
    },
  });

  const teachers = allEmployees.filter(e => e.employeeType === 'TEACHER');
  const totalStudentsTaught = teachers.reduce(
    (sum, t) => sum + t.teacherClasses.reduce((cSum, c) => cSum + c._count.students, 0),
    0
  );

  // Get subjects distribution
  const subjectsMap = new Map<string, number>();
  teachers.forEach(t => {
    t.teacherSubjects.forEach(ts => {
      const subjectName = ts.subject.name;
      subjectsMap.set(subjectName, (subjectsMap.get(subjectName) || 0) + 1);
    });
    t.subjects.forEach(s => {
      subjectsMap.set(s, (subjectsMap.get(s) || 0) + 1);
    });
  });

  const subjects = Array.from(subjectsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEmployees,
    activeEmployees,
    teachersWithClasses,
    totalStudentsTaught,
    averageClassesPerTeacher: teachers.length > 0 ? 
      (teachers.reduce((sum, t) => sum + t.teacherClasses.length, 0) / teachers.length).toFixed(1) : 0,
    subjects,
  };
};

// Subject management for teachers
export const getEmployeeSubjects = async (employeeId: string) => {
  return prisma.teacherSubject.findMany({
    where: { teacherId: employeeId },
    include: {
      subject: true,
      class: true,
    },
    orderBy: [
      { class: { name: 'asc' } },
      { subject: { name: 'asc' } },
    ],
  });
};

export const assignSubjectToEmployee = async (employeeId: string, subjectId: string, classId: string) => {
  return prisma.teacherSubject.upsert({
    where: {
      teacherId_subjectId_classId: { teacherId: employeeId, subjectId, classId },
    },
    update: {},
    create: { teacherId: employeeId, subjectId, classId },
    include: {
      subject: true,
      class: true,
    },
  });
};

export const removeSubjectFromEmployee = async (employeeId: string, subjectId: string, classId: string) => {
  return prisma.teacherSubject.delete({
    where: {
      teacherId_subjectId_classId: { teacherId: employeeId, subjectId, classId },
    },
  });
};

// Get available subjects for dropdowns
export const getAvailableSubjects = async () => {
  return prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
};

export const getAllClassesCatalog = async () => {
  return prisma.class.findMany({
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
  });
};

// Leave Management (simplified - embedded in Employee)
export const requestLeave = async (employeeId: string, leaveData: any) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  
  if (!employee) throw new Error('Employee not found');
  
  const currentLeaves = (employee.leaveRequests as any[]) || [];
  const newLeave = {
    id: Date.now().toString(),
    ...leaveData,
    status: 'PENDING',
    requestedAt: new Date(),
  };
  
  return prisma.employee.update({
    where: { id: employeeId },
    data: {
      leaveRequests: [...currentLeaves, newLeave],
    },
  });
};

export const getEmployeeLeaves = async (employeeId: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { leaveRequests: true },
  });
  
  return (employee?.leaveRequests as any[]) || [];
};
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as termService from '../services/term.service.js';

export const registerAdmin = async (email: string, password: string, name?: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const firstName = name?.split(' ')[0] || 'Admin';
  const lastName = name?.split(' ').slice(1).join(' ') || 'User';

  const user = await prisma.user.create({
    data: { 
      email, 
      password: hashedPassword, 
      firstName,
      lastName,
      role: 'ADMIN' 
    },
  });

  return user;
};

export const login = async (email: string, password: string) => {
  // Find user with unified employee relation (replaces teacherProfile, accountantProfile, staffProfile)
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: {
      employee: true,        // Unified employee (replaces teacher/accountant/staff)
      student: true,
      parentProfile: {
        include: {
          guardian: {
            include: {
              students: true
            }
          }
        }
      },
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact administrator.');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'];

  // Prepare JWT payload with role-specific IDs
  const payload: any = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // Handle all roles with unified approach
  if (user.role === 'STUDENT' && user.student) {
    payload.studentId = user.student.id;
  } 
  else if (user.role === 'EMPLOYEE' && user.employee) {
    payload.employeeId = user.employee.id;
    payload.employeeType = user.employee.employeeType;
    // For teachers, also include teacher ID for backward compatibility
    if (user.employee.employeeType === 'TEACHER') {
      payload.teacherId = user.employee.id;
    }
    // For accountants
    if (user.employee.employeeType === 'ACCOUNTANT') {
      payload.accountantId = user.employee.id;
    }
  } 
  else if (user.role === 'PARENT' && user.parentProfile) {
    payload.parentId = user.parentProfile.id;
    if (user.parentProfile.guardian?.students) {
      payload.studentIds = user.parentProfile.guardian.students.map(s => s.id);
      if (user.parentProfile.guardian.students[0]) {
        payload.studentId = user.parentProfile.guardian.students[0].id;
      }
    }
  }

  const token = jwt.sign(payload, jwtSecret, { expiresIn });

  // Remove sensitive data
  const { password: _, ...userWithoutPassword } = user;

  // Auto-check term advancement after successful login
  await termService.checkAndAutoAdvance();

  return { 
    user: userWithoutPassword, 
    token,
    studentId: user.student?.id,
    employeeId: user.employee?.id,
    employeeType: user.employee?.employeeType,
  };
};

// Helper function to get student by user ID
export const getStudentByUserId = async (userId: string) => {
  return prisma.student.findUnique({
    where: { userId },
  });
};

// Helper function to get employee by user ID (unified)
export const getEmployeeByUserId = async (userId: string) => {
  return prisma.employee.findUnique({
    where: { userId },
  });
};

// Helper function to get teacher by user ID (for backward compatibility)
export const getTeacherByUserId = async (userId: string) => {
  // Return employee with TEACHER type
  return prisma.employee.findFirst({
    where: { 
      userId,
      employeeType: 'TEACHER'
    },
  });
};

// Helper function to get parent by user ID
export const getParentByUserId = async (userId: string) => {
  return prisma.parentProfile.findUnique({
    where: { userId },
    include: {
      guardian: {
        include: {
          students: true
        }
      }
    }
  });
};

// Helper function to get accountant by user ID (for backward compatibility)
export const getAccountantByUserId = async (userId: string) => {
  return prisma.employee.findFirst({
    where: { 
      userId,
      employeeType: 'ACCOUNTANT'
    },
  });
};
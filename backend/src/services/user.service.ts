import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
}

export const getAllUsers = async (filters?: { role?: string }) => {
  const whereClause: any = {};
  
  if (filters?.role) {
    whereClause.role = filters.role as Role;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      teacherProfile: {
        select: {
          id: true,
          employeeId: true,
          qualification: true,
          subjects: true,
        }
      },
      parentProfile: {
        select: {
          id: true,
          occupation: true,
          relationship: true,
        }
      },
      student: {
        select: {
          id: true,
          admissionNumber: true,
          class: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      accountantProfile: {
        select: {
          id: true,
          employeeId: true,
          department: true,
        }
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      teacherProfile: true,
      parentProfile: true,
      student: true,
      accountantProfile: true,
    },
  });

  return user;
};

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return user;
};

export const createUser = async (input: CreateUserInput) => {
  const existingUser = await getUserByEmail(input.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      phone: input.phone,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const updateUser = async (id: string, data: any) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const deleteUser = async (id: string) => {
  await prisma.user.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};
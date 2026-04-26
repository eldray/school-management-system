import prisma from '../config/prisma.js';
import { DiscountType } from '@prisma/client';

export interface CreateScholarshipInput {
  studentId: string;
  feeTypeId?: string;      // Optional - if not provided, applies to all fee types
  termId: string;
  discountType: DiscountType; // PERCENTAGE or FIXED_AMOUNT
  discountValue: number;   // e.g., 50 for 50% off, or 500 for ₵500 off
  reason?: string;
  approvedBy?: string;
  endDate?: Date;
}

// Create a scholarship/discount for a student
export const createScholarship = async (data: CreateScholarshipInput) => {
  // Check if student exists
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
  });
  
  if (!student) {
    throw new Error('Student not found');
  }
  
  // Check if term exists
  const term = await prisma.academicTerm.findUnique({
    where: { id: data.termId },
  });
  
  if (!term) {
    throw new Error('Term not found');
  }
  
  // Check if a scholarship already exists for this student/feeType/term
  const whereClause: any = {
    studentId: data.studentId,
    termId: data.termId,
    isActive: true,
  };
  
  if (data.feeTypeId) {
    whereClause.feeTypeId = data.feeTypeId;
  } else {
    whereClause.feeTypeId = null;
  }
  
  const existing = await prisma.studentScholarship.findFirst({
    where: whereClause,
  });
  
  if (existing) {
    // Update existing scholarship instead of creating duplicate
    return prisma.studentScholarship.update({
      where: { id: existing.id },
      data: {
        discountType: data.discountType,
        discountValue: data.discountValue,
        reason: data.reason,
        approvedBy: data.approvedBy,
        endDate: data.endDate,
      },
      include: {
        student: true,
        feeType: true,
        term: true,
        approver: {
          include: {
            user: true,
          },
        },
      },
    });
  }
  
  // Create new scholarship
  const scholarship = await prisma.studentScholarship.create({
    data: {
      studentId: data.studentId,
      feeTypeId: data.feeTypeId,
      termId: data.termId,
      discountType: data.discountType,
      discountValue: data.discountValue,
      reason: data.reason,
      approvedBy: data.approvedBy,
      endDate: data.endDate,
      isActive: true,
    },
    include: {
      student: true,
      feeType: true,
      term: true,
      approver: {
        include: {
          user: true,
        },
      },
    },
  });
  
  // Update student's fee summary for this term
  const feeService = await import('./fee.service.js');
  await feeService.updateStudentFeeSummary(data.studentId, data.termId);
  
  return scholarship;
};

// Get all scholarships (for admin/accountant)
export const getAllScholarships = async (termId?: string, studentId?: string) => {
  const where: any = { isActive: true };
  
  if (termId) {
    where.termId = termId;
  }
  if (studentId) {
    where.studentId = studentId;
  }
  
  return prisma.studentScholarship.findMany({
    where,
    include: {
      student: {
        include: {
          class: true,
        },
      },
      feeType: true,
      term: true,
      approver: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Get scholarships for a specific student
export const getStudentScholarships = async (studentId: string, termId?: string) => {
  const where: any = { studentId, isActive: true };
  if (termId) {
    where.termId = termId;
  }
  
  return prisma.studentScholarship.findMany({
    where,
    include: {
      feeType: true,
      term: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Update a scholarship
export const updateScholarship = async (id: string, data: Partial<CreateScholarshipInput>) => {
  const scholarship = await prisma.studentScholarship.update({
    where: { id },
    data: {
      discountType: data.discountType,
      discountValue: data.discountValue,
      reason: data.reason,
      endDate: data.endDate,
    },
  });
  
  // Update student's fee summary
  const feeService = await import('./fee.service.js');
  await feeService.updateStudentFeeSummary(scholarship.studentId, scholarship.termId);
  
  return scholarship;
};

// Delete/Deactivate a scholarship
export const deleteScholarship = async (id: string) => {
  const scholarship = await prisma.studentScholarship.update({
    where: { id },
    data: { isActive: false },
  });
  
  // Update student's fee summary
  const feeService = await import('./fee.service.js');
  await feeService.updateStudentFeeSummary(scholarship.studentId, scholarship.termId);
  
  return scholarship;
};

// Bulk create scholarships for a class
export const bulkCreateScholarships = async (
  classId: string,
  termId: string,
  discountType: DiscountType,
  discountValue: number,
  reason?: string,
  approvedBy?: string
) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
  });
  
  const results = [];
  
  for (const student of students) {
    const existing = await prisma.studentScholarship.findFirst({
      where: {
        studentId: student.id,
        termId,
        feeTypeId: null,
        isActive: true,
      },
    });
    
    if (!existing) {
      const scholarship = await prisma.studentScholarship.create({
        data: {
          studentId: student.id,
          termId,
          discountType,
          discountValue,
          reason: reason || `Bulk discount for class`,
          approvedBy,
        },
      });
      results.push(scholarship);
      
      // Update fee summary
      const feeService = await import('./fee.service.js');
      await feeService.updateStudentFeeSummary(student.id, termId);
    }
  }
  
  return {
    classId,
    termId,
    studentsProcessed: students.length,
    scholarshipsCreated: results.length,
  };
};
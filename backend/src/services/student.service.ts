import prisma from '../config/prisma.js';
import { CreateStudentInput } from '../validators/student.validator.js';

// Note: feeService.autoAssignFeesToNewStudent expects classFeeTemplate, not feeTemplateAssignment
export const createStudent = async (data: CreateStudentInput) => {
  const { guardian, classId, ...studentData } = data;

  // Create or find guardian
  const guardianRecord = await prisma.guardian.upsert({
    where: { phone: guardian.phone },
    update: {
      name: guardian.name,
      email: guardian.email || null,
      address: guardian.address || null,
    },
    create: {
      name: guardian.name,
      phone: guardian.phone,
      email: guardian.email || null,
      address: guardian.address || null,
    },
  });

  // Generate admission number
  const year = new Date().getFullYear();
  const count = await prisma.student.count();
  const admissionNumber = `STU-${year}-${String(count + 1).padStart(4, '0')}`;

  // Create student
  const student = await prisma.student.create({
    data: {
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      dateOfBirth: new Date(studentData.dateOfBirth),
      gender: studentData.gender,
      address: studentData.address || null,
      admissionNumber,
      guardianId: guardianRecord.id,
      classId: classId || null,
    },
    include: {
      guardian: true,
      class: true,
    },
  });

  // AUTO-ASSIGN FEES: If student is assigned to a class, automatically assign fees from template
  if (student.classId) {
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { isActive: true },
    });
    
    if (activeTerm) {
      // Import feeService dynamically to avoid circular dependency
      const feeService = await import('./fee.service.js');
      await feeService.autoAssignFeesToNewStudent(student.id, student.classId, activeTerm.id);
    }
  }

  return student;
};

export const getAllStudents = async () => {
  return prisma.student.findMany({
    include: {
      guardian: true,
      class: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getStudentById = async (id: string) => {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      guardian: true,
      class: true,
      payments: {
        include: {
          feeStructure: {
            include: {
              feeType: true,
              term: true,
            },
          },
        },
      },
      attendances: true,
      scholarships: {
        where: { isActive: true },
        include: {
          feeType: true,
          term: true,
        },
      },
      feeSummaries: {
        include: {
          term: true,
        },
      },
    },
  });
  
  if (!student) return null;
  
  const activeTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
  });
  
  if (activeTerm) {
    const currentTermSummary = await prisma.studentFeeSummary.findUnique({
      where: {
        studentId_termId: { studentId: student.id, termId: activeTerm.id },
      },
    });
    
    return {
      ...student,
      currentTermFeeSummary: currentTermSummary,
    };
  }
  
  return student;
};

export const updateStudent = async (id: string, data: any) => {
  const { guardian, ...studentData } = data;
  
  const oldStudent = await prisma.student.findUnique({
    where: { id },
    select: { classId: true },
  });
  
  let guardianId = undefined;
  if (guardian) {
    const guardianRecord = await prisma.guardian.upsert({
      where: { phone: guardian.phone },
      update: guardian,
      create: guardian,
    });
    guardianId = guardianRecord.id;
  }
  
  const updatedStudent = await prisma.student.update({
    where: { id },
    data: {
      ...studentData,
      ...(guardianId && { guardianId }),
      dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : undefined,
    },
    include: {
      guardian: true,
      class: true,
    },
  });
  
  // If class changed, reassign fees
  if (oldStudent?.classId !== studentData.classId && studentData.classId) {
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { isActive: true },
    });
    
    if (activeTerm) {
      const feeService = await import('./fee.service.js');
      await feeService.autoAssignFeesToNewStudent(id, studentData.classId, activeTerm.id);
    }
  }
  
  return updatedStudent;
};

export const deleteStudent = async (id: string) => {
  return prisma.student.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });
};

export const activateStudent = async (id: string) => {
  const student = await prisma.student.findUnique({
    where: { id },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  const activatedStudent = await prisma.student.update({
    where: { id },
    data: { status: 'ACTIVE' },
    include: {
      class: true,
      guardian: true,
    },
  });
  
  if (activatedStudent.classId) {
    const activeTerm = await prisma.academicTerm.findFirst({
      where: { isActive: true },
    });
    
    if (activeTerm) {
      const feeService = await import('./fee.service.js');
      await feeService.autoAssignFeesToNewStudent(id, activatedStudent.classId, activeTerm.id);
    }
  }
  
  return activatedStudent;
};

// Get students by class
export const getStudentsByClass = async (classId: string, termId?: string) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    include: {
      guardian: true,
      scholarships: {
        where: termId ? { termId, isActive: true } : { isActive: true },
      },
      feeSummaries: {
        where: termId ? { termId } : {},
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
  
  if (termId) {
    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        termId,
      },
      include: {
        feeType: true,
        payments: true,
      },
    });
    
    return students.map(student => {
      const studentFees = feeStructures.filter(fs => fs.studentId === student.id);
      const totalFees = studentFees.reduce((sum, fs) => sum + fs.amount, 0);
      const totalPaid = studentFees.reduce(
        (sum, fs) => sum + fs.payments.reduce((pSum, p) => pSum + p.amountPaid, 0),
        0
      );
      
      return {
        ...student,
        feeSummary: { totalFees, totalPaid, balance: totalFees - totalPaid },
      };
    });
  }
  
  return students;
};
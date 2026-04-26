import prisma from '../config/prisma.js';
import { FeeCategory, PaymentMethod, DiscountType } from '@prisma/client';

// ============================================
// FEE TYPES
// ============================================

export interface CreateFeeTypeInput {
  name: string;
  description?: string;
  amount: number;
  category: FeeCategory;
}

export const createFeeType = async (data: CreateFeeTypeInput) => {
  return prisma.feeType.create({
    data: {
      name: data.name,
      description: data.description,
      amount: data.amount,
      category: data.category,
    },
  });
};

export const getAllFeeTypes = async () => {
  return prisma.feeType.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' },
  });
};

export const updateFeeType = async (id: string, data: Partial<CreateFeeTypeInput>) => {
  return prisma.feeType.update({
    where: { id },
    data,
  });
};

export const deleteFeeType = async (id: string) => {
  return prisma.feeType.update({
    where: { id },
    data: { isActive: false },
  });
};

// ============================================
// FEE TEMPLATES
// ============================================

export interface CreateFeeTemplateInput {
  name: string;
  description?: string;
  items: {
    feeTypeId: string;
    amount: number;
    isOptional?: boolean;
  }[];
}

export const getAllFeeTemplates = async () => {
  return prisma.feeTemplate.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          feeType: true,
        },
      },
      classAssignments: {
        include: {
          class: true,
          term: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createFeeTemplate = async (data: CreateFeeTemplateInput) => {
  const { name, description, items } = data;
  
  if (!items || items.length === 0) {
    throw new Error('At least one fee type is required');
  }
  
  // Validate that all fee types exist
  for (const item of items) {
    const feeType = await prisma.feeType.findUnique({
      where: { id: item.feeTypeId, isActive: true },
    });
    if (!feeType) {
      throw new Error(`Fee type with ID ${item.feeTypeId} not found`);
    }
  }
  
  // Create template with items
  const template = await prisma.feeTemplate.create({
    data: {
      name,
      description,
      items: {
        create: items.map(item => ({
          feeTypeId: item.feeTypeId,
          amount: item.amount,
          isOptional: item.isOptional || false,
        })),
      },
    },
    include: {
      items: {
        include: {
          feeType: true,
        },
      },
    },
  });
  
  return template;
};

export const updateFeeTemplate = async (id: string, data: Partial<CreateFeeTemplateInput>) => {
  const { name, description, items } = data;
  
  // Update template basic info
  await prisma.feeTemplate.update({
    where: { id },
    data: {
      name: name ?? undefined,
      description: description ?? undefined,
    },
  });
  
  // Update items if provided (delete existing and recreate)
  if (items && items.length > 0) {
    // Delete existing items
    await prisma.feeTemplateItem.deleteMany({
      where: { templateId: id },
    });
    
    // Create new items
    await prisma.feeTemplateItem.createMany({
      data: items.map(item => ({
        templateId: id,
        feeTypeId: item.feeTypeId,
        amount: item.amount,
        isOptional: item.isOptional || false,
      })),
    });
  }
  
  // Return updated template with items
  return prisma.feeTemplate.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          feeType: true,
        },
      },
    },
  });
};

export const deleteFeeTemplate = async (id: string) => {
  // Check if template is used in any assignments
  const assignments = await prisma.classFeeTemplate.count({
    where: { templateId: id },
  });
  
  if (assignments > 0) {
    throw new Error('Cannot delete template that is assigned to classes. Please remove assignments first.');
  }
  
  // Soft delete - just mark as inactive
  return prisma.feeTemplate.update({
    where: { id },
    data: { isActive: false },
  });
};

// ============================================
// CLASS FEE TEMPLATE ASSIGNMENTS
// ============================================

export const assignTemplateToClass = async (templateId: string, classId: string, termId: string) => {
  // Check if template exists and is active
  const template = await prisma.feeTemplate.findFirst({
    where: { id: templateId, isActive: true },
    include: {
      items: true,
    },
  });
  
  if (!template) {
    throw new Error('Fee template not found or inactive');
  }
  
  // Check if class exists
  const classExists = await prisma.class.findUnique({
    where: { id: classId },
  });
  
  if (!classExists) {
    throw new Error('Class not found');
  }
  
  // Check if term exists
  const term = await prisma.academicTerm.findUnique({
    where: { id: termId },
  });
  
  if (!term) {
    throw new Error('Term not found');
  }
  
  // Upsert assignment
  const assignment = await prisma.classFeeTemplate.upsert({
    where: {
      templateId_classId_termId: {
        templateId,
        classId,
        termId,
      },
    },
    update: {
      isActive: true,
    },
    create: {
      templateId,
      classId,
      termId,
      isActive: true,
    },
  });
  
  // Get all active students in this class
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
  });
  
  // Apply fees to students (create FeeStructure records)
  let feesCreated = 0;
  
  for (const student of students) {
    for (const item of template.items) {
      // Check if student already has this fee for this term
      const existing = await prisma.feeStructure.findFirst({
        where: {
          studentId: student.id,
          feeTypeId: item.feeTypeId,
          termId,
        },
      });
      
      if (!existing) {
        await prisma.feeStructure.create({
          data: {
            feeTypeId: item.feeTypeId,
            studentId: student.id,
            amount: item.amount,
            termId,
          },
        });
        feesCreated++;
      }
    }
    
    // Update student fee summary
    await updateStudentFeeSummary(student.id, termId);
  }
  
  return {
    assignment,
    studentsAffected: students.length,
    feesCreated,
    message: `Template "${template.name}" assigned to class "${classExists.name}" for term "${term.name}". ${feesCreated} fee records created.`,
  };
};

export const getClassTemplateAssignments = async (termId?: string) => {
  const where: any = { isActive: true };
  if (termId) {
    where.termId = termId;
  }
  
  return prisma.classFeeTemplate.findMany({
    where,
    include: {
      template: {
        include: {
          items: {
            include: {
              feeType: true,
            },
          },
        },
      },
      class: true,
      term: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const removeClassTemplateAssignment = async (assignmentId: string) => {
  const assignment = await prisma.classFeeTemplate.findUnique({
    where: { id: assignmentId },
  });
  
  if (!assignment) {
    throw new Error('Assignment not found');
  }
  
  // Soft delete
  return prisma.classFeeTemplate.update({
    where: { id: assignmentId },
    data: { isActive: false },
  });
};

// ============================================
// STUDENT FEES (Calculated from templates + scholarships)
// ============================================

export const getStudentFeesForTerm = async (studentId: string, termId: string) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });
  
  if (!student) throw new Error('Student not found');
  if (!student.classId) return [];
  
  // Get the class fee template for this term
  const classAssignment = await prisma.classFeeTemplate.findFirst({
    where: {
      classId: student.classId,
      termId,
      isActive: true,
    },
    include: {
      template: {
        include: {
          items: {
            include: {
              feeType: true,
            },
          },
        },
      },
    },
  });
  
  if (!classAssignment) return [];
  
  // Get student's scholarships for this term
  const scholarships = await prisma.studentScholarship.findMany({
    where: {
      studentId,
      termId,
      isActive: true,
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
  });
  
  // Build fee items with scholarship calculations
  const feeItems = [];
  
  for (const item of classAssignment.template.items) {
    // Find applicable scholarships
    const applicableScholarships = scholarships.filter(s => 
      (!s.feeTypeId || s.feeTypeId === item.feeTypeId) &&
      (!s.templateId || s.templateId === classAssignment.templateId)
    );
    
    let finalAmount = item.amount;
    let discountAmount = 0;
    let appliedScholarship = null;
    
    // Apply the best scholarship (highest discount)
    if (applicableScholarships.length > 0) {
      // Sort by discount value (highest first)
      applicableScholarships.sort((a, b) => {
        if (a.discountType === 'PERCENTAGE' && b.discountType === 'PERCENTAGE') {
          return b.discountValue - a.discountValue;
        }
        if (a.discountType === 'FIXED_AMOUNT' && b.discountType === 'FIXED_AMOUNT') {
          return b.discountValue - a.discountValue;
        }
        // Percentage discounts are applied first, then fixed
        return a.discountType === 'PERCENTAGE' ? -1 : 1;
      });
      
      appliedScholarship = applicableScholarships[0];
      
      if (appliedScholarship.discountType === 'PERCENTAGE') {
        discountAmount = (item.amount * appliedScholarship.discountValue) / 100;
        finalAmount = item.amount - discountAmount;
      } else {
        discountAmount = Math.min(appliedScholarship.discountValue, item.amount);
        finalAmount = item.amount - discountAmount;
      }
    }
    
    feeItems.push({
      feeTypeId: item.feeTypeId,
      feeType: item.feeType,
      originalAmount: item.amount,
      discountAmount,
      finalAmount,
      isOptional: item.isOptional,
      hasScholarship: !!appliedScholarship,
      scholarshipId: appliedScholarship?.id,
    });
  }
  
  // Get existing FeeStructure records (for payments)
  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      studentId,
      termId,
    },
    include: {
      feeType: true,
      payments: true,
    },
  });
  
  // Merge calculated fees with existing payments
  const result = feeItems.map(item => {
    const existing = feeStructures.find(fs => fs.feeTypeId === item.feeTypeId);
    const totalPaid = existing?.payments.reduce((sum, p) => sum + p.amountPaid, 0) || 0;
    const balance = item.finalAmount - totalPaid;
    
    return {
      ...item,
      id: existing?.id,
      totalPaid,
      balance: balance > 0 ? balance : 0,
      isFullyPaid: balance <= 0,
    };
  });
  
  return result;
};

// Legacy support for existing API
export const getStudentFees = async (studentId: string, termId?: string) => {
  if (termId) {
    return getStudentFeesForTerm(studentId, termId);
  }
  
  // If no term specified, get all terms
  const terms = await prisma.academicTerm.findMany({
    orderBy: { startDate: 'desc' },
  });
  
  const allFees = [];
  for (const term of terms) {
    const termFees = await getStudentFeesForTerm(studentId, term.id);
    allFees.push(...termFees.map(f => ({ ...f, term })));
  }
  
  return allFees;
};

// ============================================
// SCHOLARSHIPS
// ============================================

export interface CreateScholarshipInput {
  studentId: string;
  feeTypeId?: string;
  templateId?: string;
  termId: string;
  discountType: DiscountType;
  discountValue: number;
  reason?: string;
  approvedBy?: string;
  endDate?: Date;
}

export const createScholarship = async (data: CreateScholarshipInput) => {
  const scholarship = await prisma.studentScholarship.create({
    data: {
      studentId: data.studentId,
      feeTypeId: data.feeTypeId,
      templateId: data.templateId,
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
      template: true,
      term: true,
    },
  });
  
  // Update student's fee summary for this term
  await updateStudentFeeSummary(data.studentId, data.termId);
  
  return scholarship;
};

export const getStudentScholarships = async (studentId: string, termId?: string) => {
  const where: any = { studentId, isActive: true };
  if (termId) {
    where.termId = termId;
  }
  
  return prisma.studentScholarship.findMany({
    where,
    include: {
      feeType: true,
      template: true,
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

export const deleteScholarship = async (id: string) => {
  const scholarship = await prisma.studentScholarship.update({
    where: { id },
    data: { isActive: false },
  });
  
  if (scholarship) {
    await updateStudentFeeSummary(scholarship.studentId, scholarship.termId);
  }
  
  return scholarship;
};

// ============================================
// STUDENT FEE SUMMARY
// ============================================

export const updateStudentFeeSummary = async (studentId: string, termId: string) => {
  const fees = await getStudentFeesForTerm(studentId, termId);
  
  const totalFees = fees.reduce((sum, f) => sum + f.finalAmount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.totalPaid || 0), 0);
  const balance = totalFees - totalPaid;
  
  const summary = await prisma.studentFeeSummary.upsert({
    where: {
      studentId_termId: { studentId, termId },
    },
    update: {
      totalFees,
      totalPaid,
      balance,
    },
    create: {
      studentId,
      termId,
      totalFees,
      totalPaid,
      balance,
    },
  });
  
  return summary;
};

export const getStudentFeeSummary = async (studentId: string, termId: string) => {
  return prisma.studentFeeSummary.findUnique({
    where: {
      studentId_termId: { studentId, termId },
    },
    include: {
      student: true,
      term: true,
    },
  });
};

// ============================================
// PAYMENTS
// ============================================

export interface RecordPaymentInput {
  studentId: string;
  feeTypeId: string;
  termId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  remarks?: string;
  recordedBy?: string;
}

const generateReceiptNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const count = await prisma.feeTransaction.count({
    where: {
      createdAt: {
        gte: new Date(date.getFullYear(), date.getMonth(), 1),
      },
    },
  });
  
  return `RCT-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
};

export const recordPayment = async (data: RecordPaymentInput) => {
  const { studentId, feeTypeId, termId, amountPaid, paymentMethod, transactionRef, remarks, recordedBy } = data;
  
  // Get or create fee structure for this student/fee/term
  let feeStructure = await prisma.feeStructure.findFirst({
    where: {
      studentId,
      feeTypeId,
      termId,
    },
  });
  
  if (!feeStructure) {
    // Get the amount from the class template or use default
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });
    
    if (!student) throw new Error('Student not found');
    
    const classAssignment = await prisma.classFeeTemplate.findFirst({
      where: {
        classId: student.classId,
        termId,
        isActive: true,
      },
      include: {
        template: {
          include: {
            items: {
              where: { feeTypeId },
            },
          },
        },
      },
    });
    
    const templateItem = classAssignment?.template.items[0];
    const amount = templateItem?.amount || 0;
    
    feeStructure = await prisma.feeStructure.create({
      data: {
        feeTypeId,
        studentId,
        amount,
        termId,
      },
    });
  }
  
  const receiptNumber = await generateReceiptNumber();
  
  // Calculate new paid amount and balance
  const existingPayments = await prisma.payment.findMany({
    where: { feeStructureId: feeStructure.id },
  });
  const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const newTotalPaid = totalPaidSoFar + amountPaid;
  const newBalance = feeStructure.amount - newTotalPaid;
  
  // Create the payment
  const payment = await prisma.payment.create({
    data: {
      studentId,
      feeStructureId: feeStructure.id,
      amount: feeStructure.amount,
      amountPaid,
      balance: newBalance < 0 ? 0 : newBalance,
      paymentMethod,
      transactionRef,
      receiptNumber,
      status: 'SUCCESS',
      recordedBy,
      remarks,
    },
    include: {
      student: true,
      feeStructure: {
        include: {
          feeType: true,
          term: true,
        },
      },
    },
  });
  
  // Create transaction record
  await prisma.feeTransaction.create({
    data: {
      studentId,
      termId,
      amount: amountPaid,
      paymentMethod,
      receiptNumber,
      transactionRef,
      status: 'SUCCESS',
      remarks,
      recordedBy,
      items: {
        create: {
          feeTypeId,
          amount: amountPaid,
          discountApplied: 0,
          netAmount: amountPaid,
        },
      },
    },
  });
  
  // Update student fee summary
  await updateStudentFeeSummary(studentId, termId);
  
  return payment;
};

export const getStudentPayments = async (studentId: string, termId?: string) => {
  const where: any = { studentId };
  if (termId) {
    where.feeStructure = { termId };
  }
  
  return prisma.payment.findMany({
    where,
    include: {
      feeStructure: {
        include: {
          feeType: true,
          term: true,
        },
      },
    },
    orderBy: { paymentDate: 'desc' },
  });
};

export const getPaymentById = async (id: string) => {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      student: {
        include: { class: true },
      },
      feeStructure: {
        include: {
          feeType: true,
          term: true,
        },
      },
    },
  });
};

export const getReceiptByNumber = async (receiptNumber: string) => {
  const payment = await prisma.payment.findFirst({
    where: { receiptNumber },
    include: {
      student: { include: { class: true } },
      feeStructure: { include: { feeType: true, term: true } },
    },
  });
  
  if (!payment) throw new Error('Receipt not found');
  
  return {
    receiptNumber: payment.receiptNumber,
    paymentDate: payment.paymentDate,
    student: {
      id: payment.student.id,
      name: `${payment.student.firstName} ${payment.student.lastName}`,
      admissionNumber: payment.student.admissionNumber,
      class: payment.student.class?.name,
    },
    term: payment.feeStructure.term.name,
    items: [{
      feeType: payment.feeStructure.feeType.name,
      amount: payment.amount,
      amountPaid: payment.amountPaid,
    }],
    totalAmount: payment.amountPaid,
    paymentMethod: payment.paymentMethod,
    transactionRef: payment.transactionRef,
    remarks: payment.remarks,
  };
};

export const getAllPayments = async (filters?: {
  termId?: string;
  classId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const where: any = {};
  
  if (filters?.termId) {
    where.feeStructure = { termId: filters.termId };
  }
  if (filters?.classId) {
    where.student = { classId: filters.classId };
  }
  if (filters?.startDate) {
    where.paymentDate = { gte: filters.startDate };
  }
  if (filters?.endDate) {
    where.paymentDate = { ...where.paymentDate, lte: filters.endDate };
  }
  
  const payments = await prisma.payment.findMany({
    where,
    include: {
      student: { include: { class: true } },
      feeStructure: { include: { feeType: true, term: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });
  
  return payments.map(payment => ({
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    paymentDate: payment.paymentDate,
    amountPaid: payment.amountPaid,
    paymentMethod: payment.paymentMethod,
    transactionRef: payment.transactionRef,
    remarks: payment.remarks,
    student: payment.student,
    term: payment.feeStructure.term,
    feeStructure: payment.feeStructure,
  }));
};

// ============================================
// AUTO-ASSIGN FEES TO NEW STUDENT
// ============================================

export const autoAssignFeesToNewStudent = async (studentId: string, classId: string, termId: string) => {
  // Get the class fee template for this term
  const classAssignment = await prisma.classFeeTemplate.findFirst({
    where: {
      classId,
      termId,
      isActive: true,
    },
    include: {
      template: {
        include: {
          items: true,
        },
      },
    },
  });
  
  if (!classAssignment) {
    return { assigned: false, message: 'No fee template assigned to this class for the term' };
  }
  
  // Create fee structures for the student based on template items
  let feesCreated = 0;
  
  for (const item of classAssignment.template.items) {
    const existing = await prisma.feeStructure.findFirst({
      where: {
        studentId,
        feeTypeId: item.feeTypeId,
        termId,
      },
    });
    
    if (!existing) {
      await prisma.feeStructure.create({
        data: {
          feeTypeId: item.feeTypeId,
          studentId,
          amount: item.amount,
          termId,
        },
      });
      feesCreated++;
    }
  }
  
  // Update student's fee summary
  await updateStudentFeeSummary(studentId, termId);
  
  return {
    assigned: true,
    feesAssigned: feesCreated,
    message: `Auto-assigned ${feesCreated} fees to student`,
  };
};

// ============================================
// CLASS FEE SUMMARY (for reports)
// ============================================

export const getClassFees = async (classId: string, termId: string) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
  });
  
  const summaries = await Promise.all(
    students.map(async (student) => {
      const fees = await getStudentFeesForTerm(student.id, termId);
      const totalFees = fees.reduce((sum, f) => sum + f.finalAmount, 0);
      const totalPaid = fees.reduce((sum, f) => sum + (f.totalPaid || 0), 0);
      
      return {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
        },
        totalFees,
        totalPaid,
        balance: totalFees - totalPaid,
        fees,
      };
    })
  );
  
  return summaries;
};

export const getFeeCollectionReport = async (termId: string, classId?: string) => {
  const summaries = await prisma.studentFeeSummary.findMany({
    where: {
      termId,
      ...(classId && { student: { classId } }),
    },
    include: {
      student: {
        include: { class: true },
      },
      term: true,
    },
  });
  
  const totalExpected = summaries.reduce((sum, s) => sum + s.totalFees, 0);
  const totalCollected = summaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalOutstanding = totalExpected - totalCollected;
  
  return {
    termId,
    classId,
    totalExpected,
    totalCollected,
    totalOutstanding,
    collectionRate: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
    students: summaries,
  };
};

// ============================================
// NEXT TERM HELPERS
// ============================================

export const getNextTerm = async () => {
  const terms = await prisma.academicTerm.findMany({
    orderBy: { startDate: 'asc' },
  });
  
  const now = new Date();
  const nextTerm = terms.find(term => new Date(term.startDate) > now);
  
  return nextTerm || terms[terms.length - 1];
};

// ============================================
// LEGACY SUPPORT (for existing API calls)
// ============================================

export const assignFeesToClass = async (data: any) => {
  // Legacy - use assignTemplateToClass instead
  throw new Error('Use assignTemplateToClass instead');
};

export const assignFeesToStudent = async (data: any) => {
  // Legacy - use createScholarship for modifications
  throw new Error('Use createScholarship for fee modifications');
};

export const getClassFeesLegacy = async (classId: string, termId: string) => {
  return getClassFees(classId, termId);
};

export const recordBulkPayment = async (data: any) => {
  // Legacy - use recordPayment for each fee type
  throw new Error('Use recordPayment for individual fee payments');
};

export const getAutoChargeableFeeStructures = async (termId: string) => {
  const assignments = await prisma.classFeeTemplate.findMany({
    where: { termId, isActive: true },
    include: {
      template: {
        include: {
          items: {
            include: {
              feeType: true,
            },
          },
        },
      },
      class: true,
    },
  });
  
  return assignments;
};

export const autoChargeStudentsForNewTerm = async (data: any) => {
  // This is handled by assignTemplateToClass
  throw new Error('Use assignTemplateToClass to assign fees for a term');
};

export const bulkAssignFeesToClass = async (classId: string, termId: string, feeTypeIds: string[]) => {
  // For bulk operations, create a template first, then assign
  throw new Error('Create a template first, then assign it to the class');
};
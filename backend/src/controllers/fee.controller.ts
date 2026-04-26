import { Request, Response } from 'express';
import * as feeService from '../services/fee.service.js';

// ============================================
// FEE TYPES
// ============================================

export const createFeeType = async (req: Request, res: Response) => {
  try {
    const feeType = await feeService.createFeeType(req.body);
    res.status(201).json({ success: true, data: feeType });
  } catch (error: any) {
    console.error('Create fee type error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllFeeTypes = async (req: Request, res: Response) => {
  try {
    const feeTypes = await feeService.getAllFeeTypes();
    res.status(200).json({ success: true, data: feeTypes });
  } catch (error: any) {
    console.error('Get fee types error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFeeType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const feeType = await feeService.updateFeeType(id, req.body);
    res.status(200).json({ success: true, data: feeType });
  } catch (error: any) {
    console.error('Update fee type error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFeeType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await feeService.deleteFeeType(id);
    res.status(200).json({ success: true, message: 'Fee type deleted successfully' });
  } catch (error: any) {
    console.error('Delete fee type error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// FEE STRUCTURES (Assignments)
// ============================================

export const assignFeesToClass = async (req: Request, res: Response) => {
  try {
    const result = await feeService.assignFeesToClass(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Assign fees to class error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignFeesToStudent = async (req: Request, res: Response) => {
  try {
    const result = await feeService.assignFeesToStudent(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Assign fees to student error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getNextTerm = async (req: Request, res: Response) => {
  try {
    const nextTerm = await feeService.getNextTerm();
    res.status(200).json({ success: true, data: nextTerm });
  } catch (error: any) {
    console.error('Get next term error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATED: Get student fees - Now works with token or params
export const getStudentFees = async (req: Request, res: Response) => {
  try {
    let studentId = req.params.studentId;
    const { termId } = req.query;
    const user = (req as any).user;
    
    // If no studentId in params, try to get from authenticated user
    if (!studentId && user) {
      // For student role, use studentId from token
      if (user.role === 'STUDENT') {
        studentId = user.studentId;
      }
      // For parent role, use their linked student
      else if (user.role === 'PARENT') {
        if (user.studentId) {
          studentId = user.studentId;
        } else if (user.studentIds && user.studentIds.length > 0) {
          studentId = user.studentIds[0];
        }
      }
    }
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required. Please provide a valid student ID.' 
      });
    }
    
    const fees = await feeService.getStudentFees(studentId, termId as string);
    res.status(200).json({ success: true, data: fees });
  } catch (error: any) {
    console.error('Get student fees error:', error);
    
    if (error.message === 'Student not found') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found. Please contact administrator.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to retrieve student fees' 
    });
  }
};

export const getClassFees = async (req: Request, res: Response) => {
  try {
    const { classId, termId } = req.params;
    const fees = await feeService.getClassFees(classId, termId);
    res.status(200).json({ success: true, data: fees });
  } catch (error: any) {
    console.error('Get class fees error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PAYMENTS
// ============================================

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const payment = await feeService.recordPayment({
      ...req.body,
      recordedBy: user.id,
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    console.error('Record payment error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { termId, classId, startDate, endDate } = req.query;
    const payments = await feeService.getAllPayments({
      termId: termId as string,
      classId: classId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    console.error('Get all payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await feeService.getPaymentById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    console.error('Get payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentPayments = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId } = req.query;
    const payments = await feeService.getStudentPayments(studentId, termId as string);
    res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    console.error('Get student payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await feeService.getPaymentById(id);
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        receiptNumber: payment.receiptNumber,
        date: payment.paymentDate,
        student: {
          name: `${payment.student.firstName} ${payment.student.lastName}`,
          admissionNumber: payment.student.admissionNumber,
          class: payment.student.class?.name,
        },
        feeType: payment.feeStructure.feeType.name,
        amount: payment.amount,
        amountPaid: payment.amountPaid,
        balance: payment.balance,
        paymentMethod: payment.paymentMethod,
        term: payment.feeStructure.term.name,
      },
    });
  } catch (error: any) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// REPORTS
// ============================================

export const getFeeCollectionReport = async (req: Request, res: Response) => {
  try {
    const { termId } = req.params;
    const { classId } = req.query;
    const report = await feeService.getFeeCollectionReport(termId, classId as string);
    res.status(200).json({ success: true, data: report });
  } catch (error: any) {
    console.error('Get fee collection report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentFeeSummary = async (req: Request, res: Response) => {
  try {
    const { studentId, termId } = req.params;
    const summary = await feeService.getStudentFeeSummary(studentId, termId);
    
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Fee summary not found' });
    }
    
    res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Get student fee summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordBulkPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await feeService.recordBulkPayment({
      ...req.body,
      recordedBy: user.id,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Record bulk payment error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getReceiptByNumber = async (req: Request, res: Response) => {
  try {
    const { receiptNumber } = req.params;
    const receipt = await feeService.getReceiptByNumber(receiptNumber);
    res.status(200).json({ success: true, data: receipt });
  } catch (error: any) {
    console.error('Get receipt error:', error);
    res.status(404).json({ success: false, message: error.message });
  }
};

// ============================================
// AUTO-CHARGE CONTROLLERS
// ============================================

export const autoChargeStudentsForNewTerm = async (req: Request, res: Response) => {
  try {
    const result = await feeService.autoChargeStudentsForNewTerm(req.body);
    res.status(200).json({ 
      success: true, 
      data: result,
      message: `Successfully processed ${result.totalStudents} students with ${result.feesAssigned} fee assignments` 
    });
  } catch (error: any) {
    console.error('Auto-charge error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAutoChargeableFeeStructures = async (req: Request, res: Response) => {
  try {
    const { termId } = req.params;
    const feeStructures = await feeService.getAutoChargeableFeeStructures(termId);
    res.status(200).json({ success: true, data: feeStructures });
  } catch (error: any) {
    console.error('Get auto-chargeable fees error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkAssignFeesToClass = async (req: Request, res: Response) => {
  try {
    const { classId, termId } = req.params;
    const { feeTypeIds } = req.body;
    const result = await feeService.bulkAssignFeesToClass(classId, termId, feeTypeIds);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Bulk assign fees error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// FEE TEMPLATE CONTROLLERS
// ============================================

export const getAllFeeTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await feeService.getAllFeeTemplates();
    res.status(200).json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Get fee templates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFeeTemplate = async (req: Request, res: Response) => {
  try {
    const template = await feeService.createFeeTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    console.error('Create fee template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFeeTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await feeService.updateFeeTemplate(id, req.body);
    res.status(200).json({ success: true, data: template });
  } catch (error: any) {
    console.error('Update fee template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFeeTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await feeService.deleteFeeTemplate(id);
    res.status(200).json({ success: true, message: 'Fee template deleted successfully' });
  } catch (error: any) {
    console.error('Delete fee template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// FEE TEMPLATE ASSIGNMENT CONTROLLERS
// ============================================

export const assignTemplateToClass = async (req: Request, res: Response) => {
  try {
    const { templateId, classId, termId } = req.body;
    const result = await feeService.assignTemplateToClass(templateId, classId, termId);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Assign template to class error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getClassTemplateAssignments = async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const assignments = await feeService.getClassTemplateAssignments(termId as string);
    res.status(200).json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Get template assignments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ============================================
// SCHOLARSHIP CONTROLLERS
// ============================================

export const createScholarship = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const scholarship = await scholarshipService.createScholarship({
      ...req.body,
      approvedBy: user.id,
    });
    res.status(201).json({ success: true, data: scholarship });
  } catch (error: any) {
    console.error('Create scholarship error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllScholarships = async (req: Request, res: Response) => {
  try {
    const { termId, studentId } = req.query;
    const scholarships = await scholarshipService.getAllScholarships(
      termId as string,
      studentId as string
    );
    res.status(200).json({ success: true, data: scholarships });
  } catch (error: any) {
    console.error('Get scholarships error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentScholarships = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId } = req.query;
    const scholarships = await scholarshipService.getStudentScholarships(
      studentId,
      termId as string
    );
    res.status(200).json({ success: true, data: scholarships });
  } catch (error: any) {
    console.error('Get student scholarships error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateScholarship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scholarship = await scholarshipService.updateScholarship(id, req.body);
    res.status(200).json({ success: true, data: scholarship });
  } catch (error: any) {
    console.error('Update scholarship error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteScholarship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await scholarshipService.deleteScholarship(id);
    res.status(200).json({ success: true, message: 'Scholarship removed successfully' });
  } catch (error: any) {
    console.error('Delete scholarship error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const bulkCreateScholarships = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { classId, termId, discountType, discountValue, reason } = req.body;
    const result = await scholarshipService.bulkCreateScholarships(
      classId,
      termId,
      discountType,
      discountValue,
      reason,
      user.id
    );
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Bulk create scholarships error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
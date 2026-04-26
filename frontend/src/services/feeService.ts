import api from '../lib/api';
import { FeeType, FeeStructure, Payment, StudentFeeSummary, CreateFeeTypeInput, BulkFeeAssignmentInput, RecordPaymentInput } from '../types/fee';
import { AcademicTerm } from '../types/exam';

export const feeService = {
  // Fee Types
  getAllFeeTypes: async (): Promise<FeeType[]> => {
    const res = await api.get('/fees/types');
    return res.data.data;
  },

  createFeeType: async (data: CreateFeeTypeInput): Promise<FeeType> => {
    const res = await api.post('/fees/types', data);
    return res.data.data;
  },

  updateFeeType: async (id: string, data: Partial<CreateFeeTypeInput>): Promise<FeeType> => {
    const res = await api.put(`/fees/types/${id}`, data);
    return res.data.data;
  },

  deleteFeeType: async (id: string): Promise<void> => {
    await api.delete(`/fees/types/${id}`);
  },

  // Next Term (default for fee assignment)
  getNextTerm: async (): Promise<AcademicTerm> => {
    const res = await api.get('/fees/next-term');
    return res.data.data;
  },

  // Bulk Fee Assignments
  assignFeesToClass: async (data: BulkFeeAssignmentInput): Promise<FeeStructure[]> => {
    const res = await api.post('/fees/assign/class', data);
    return res.data.data;
  },

  assignFeesToStudent: async (data: BulkFeeAssignmentInput): Promise<FeeStructure[]> => {
    const res = await api.post('/fees/assign/student', data);
    return res.data.data;
  },

  getStudentFees: async (studentId: string, termId: string): Promise<FeeStructure[]> => {
    const res = await api.get(`/fees/student/${studentId}/term/${termId}`);
    return res.data.data;
  },

  getClassFees: async (classId: string, termId: string): Promise<any[]> => {
    const res = await api.get(`/fees/class/${classId}/term/${termId}`);
    return res.data.data;
  },

  // Payments
  recordPayment: async (data: RecordPaymentInput): Promise<Payment> => {
    const res = await api.post('/fees/payments', data);
    return res.data.data;
  },

  getAllPayments: async (filters?: { termId?: string; classId?: string }): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (filters?.termId) params.append('termId', filters.termId);
    if (filters?.classId) params.append('classId', filters.classId);
    const res = await api.get(`/fees/payments?${params.toString()}`);
    return res.data.data;
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const res = await api.get(`/fees/payments/${id}`);
    return res.data.data;
  },

  getStudentPayments: async (studentId: string, termId?: string): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (termId) params.append('termId', termId);
    const res = await api.get(`/fees/student/${studentId}/payments?${params.toString()}`);
    return res.data.data;
  },

  getStudentFeeSummary: async (studentId: string, termId: string): Promise<StudentFeeSummary> => {
    const res = await api.get(`/fees/summary/${studentId}/${termId}`);
    return res.data.data;
  },

  getReceiptUrl: (paymentId: string): string => {
    return `${api.defaults.baseURL}/fees/payments/${paymentId}/receipt`;
  },
};
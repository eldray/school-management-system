import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeService } from '../services/feeService';
import { CreateFeeTypeInput, BulkFeeAssignmentInput, RecordPaymentInput } from '../types/fee';

export const feeKeys = {
  all: ['fees'] as const,
  types: () => [...feeKeys.all, 'types'] as const,
  nextTerm: () => [...feeKeys.all, 'next-term'] as const,
  structures: () => [...feeKeys.all, 'structures'] as const,
  studentFees: (studentId: string, termId?: string) => [...feeKeys.structures(), studentId, termId || 'all'] as const,
  classFees: (classId: string, termId: string) => [...feeKeys.structures(), 'class', classId, termId] as const,
  payments: () => [...feeKeys.all, 'payments'] as const,
  paymentList: (filters: any) => [...feeKeys.payments(), filters] as const,
  paymentDetail: (id: string) => [...feeKeys.payments(), id] as const,
  studentPayments: (studentId: string) => [...feeKeys.payments(), 'student', studentId] as const,
  summary: (studentId: string, termId: string) => [...feeKeys.all, 'summary', studentId, termId] as const,
};

// Fee Types
export const useFeeTypes = () => {
  return useQuery({
    queryKey: feeKeys.types(),
    queryFn: () => feeService.getAllFeeTypes(),
  });
};

export const useCreateFeeType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeeTypeInput) => feeService.createFeeType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.types() });
    },
  });
};

export const useUpdateFeeType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFeeTypeInput> }) =>
      feeService.updateFeeType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.types() });
    },
  });
};

export const useDeleteFeeType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeService.deleteFeeType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.types() });
    },
  });
};

// Next Term
export const useNextTerm = () => {
  return useQuery({
    queryKey: feeKeys.nextTerm(),
    queryFn: () => feeService.getNextTerm(),
  });
};

// Bulk Fee Assignments
export const useAssignFeesToClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkFeeAssignmentInput) => feeService.assignFeesToClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
  });
};

export const useAssignFeesToStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkFeeAssignmentInput) => feeService.assignFeesToStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
  });
};

// UPDATED: Student Fees - termId is optional (fetches all terms if not provided)
export const useStudentFees = (studentId: string, termId?: string) => {
  return useQuery({
    queryKey: feeKeys.studentFees(studentId, termId),
    queryFn: () => feeService.getStudentFees(studentId, termId),
    enabled: !!studentId,
  });
};

export const useClassFees = (classId: string, termId: string) => {
  return useQuery({
    queryKey: feeKeys.classFees(classId, termId),
    queryFn: () => feeService.getClassFees(classId, termId),
    enabled: !!classId && !!termId,
  });
};

// Payments
export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordPaymentInput) => feeService.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
  });
};

export const usePayments = (filters?: { termId?: string; classId?: string }) => {
  return useQuery({
    queryKey: feeKeys.paymentList(filters),
    queryFn: () => feeService.getAllPayments(filters),
  });
};

export const usePayment = (id: string) => {
  return useQuery({
    queryKey: feeKeys.paymentDetail(id),
    queryFn: () => feeService.getPaymentById(id),
    enabled: !!id,
  });
};

// Get student payments
export const useStudentPayments = (studentId: string, termId?: string) => {
  return useQuery({
    queryKey: ['student-payments', studentId, termId],
    queryFn: async () => {
      const params = termId ? `?termId=${termId}` : '';
      const res = await api.get(`/fees/students/${studentId}/payments${params}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });
};

export const useStudentFeeSummary = (studentId: string, termId: string) => {
  return useQuery({
    queryKey: feeKeys.summary(studentId, termId),
    queryFn: () => feeService.getStudentFeeSummary(studentId, termId),
    enabled: !!studentId && !!termId,
  });
};

// Get student fee structures (what they owe)
export const useStudentFeeStructures = (studentId: string, termId?: string) => {
  return useQuery({
    queryKey: ['student-fee-structures', studentId, termId],
    queryFn: async () => {
      const params = termId ? `?termId=${termId}` : '';
      const res = await api.get(`/fees/students/${studentId}/fees${params}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });
};

// Auto-charge students for new term
export const useAutoChargeStudents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { termId: string; feeStructureIds: string[] }) => {
      const res = await api.post('/fees/auto-charge', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      queryClient.invalidateQueries({ queryKey: ['student-fee-structures'] });
    },
  });
};


// Fee Templates
export const useFeeTemplates = () => {
  return useQuery({
    queryKey: ['fee-templates'],
    queryFn: async () => {
      const res = await api.get('/fees/templates');
      return res.data.data;
    },
  });
};

export const useCreateFeeTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/fees/templates', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-templates'] });
    },
  });
};

export const useUpdateFeeTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/fees/templates/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-templates'] });
    },
  });
};

export const useDeleteFeeTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fees/templates/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-templates'] });
    },
  });
};

// Template Assignment
export const useAssignTemplateToClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, classId, termId }: { templateId: string; classId: string; termId: string }) => {
      const res = await api.post('/fees/templates/assign', { templateId, classId, termId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-template-assignments'] });
      queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
  });
};

export const useClassTemplateAssignments = (termId?: string) => {
  return useQuery({
    queryKey: ['fee-template-assignments', termId],
    queryFn: async () => {
      const params = termId ? `?termId=${termId}` : '';
      const res = await api.get(`/fees/templates/assignments${params}`);
      return res.data.data;
    },
  });
};

export const useBulkAssignFeesToClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, termId, feeTypeIds }: { classId: string; termId: string; feeTypeIds: string[] }) => {
      const res = await api.post(`/fees/classes/${classId}/terms/${termId}/bulk-assign`, { feeTypeIds });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
      queryClient.invalidateQueries({ queryKey: ['student-fee-summaries'] });
    },
  });
};

// Add these to your useFees.ts

// ============================================
// SCHOLARSHIP HOOKS
// ============================================

export const useCreateScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      studentId: string;
      feeTypeId?: string;
      templateId?: string;
      termId: string;
      discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
      discountValue: number;
      reason?: string;
      endDate?: string;
    }) => {
      const res = await api.post('/fees/scholarships', data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-fee-structures', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: feeKeys.summary(variables.studentId, variables.termId) });
      queryClient.invalidateQueries({ queryKey: ['student-scholarships', variables.studentId] });
    },
  });
};

export const useStudentScholarships = (studentId: string, termId?: string) => {
  return useQuery({
    queryKey: ['student-scholarships', studentId, termId],
    queryFn: async () => {
      const params = termId ? `?termId=${termId}` : '';
      const res = await api.get(`/fees/students/${studentId}/scholarships${params}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });
};

export const useDeleteScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fees/scholarships/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-scholarships'] });
      queryClient.invalidateQueries({ queryKey: feeKeys.structures() });
    },
  });
};

export const useStudentFullFeeSummary = (studentId: string, termId: string) => {
  return useQuery({
    queryKey: ['student-full-fee-summary', studentId, termId],
    queryFn: async () => {
      const res = await api.get(`/fees/students/${studentId}/terms/${termId}/full-summary`);
      return res.data.data;
    },
    enabled: !!studentId && !!termId,
  });
};
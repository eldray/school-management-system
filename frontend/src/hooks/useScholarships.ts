import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const scholarshipKeys = {
  all: ['scholarships'] as const,
  lists: () => [...scholarshipKeys.all, 'list'] as const,
  list: (filters: any) => [...scholarshipKeys.lists(), filters] as const,
  details: () => [...scholarshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...scholarshipKeys.details(), id] as const,
  student: (studentId: string, termId?: string) => [...scholarshipKeys.all, 'student', studentId, termId] as const,
};

// Get all scholarships
export const useScholarships = (filters?: { termId?: string; studentId?: string }) => {
  return useQuery({
    queryKey: scholarshipKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.termId) params.append('termId', filters.termId);
      if (filters?.studentId) params.append('studentId', filters.studentId);
      const res = await api.get(`/fees/scholarships?${params.toString()}`);
      return res.data.data;
    },
  });
};

// Get student's scholarships
export const useStudentScholarships = (studentId: string, termId?: string) => {
  return useQuery({
    queryKey: scholarshipKeys.student(studentId, termId),
    queryFn: async () => {
      const params = termId ? `?termId=${termId}` : '';
      const res = await api.get(`/fees/students/${studentId}/scholarships${params}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });
};

// Create scholarship
export const useCreateScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/fees/scholarships', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scholarshipKeys.all });
    },
  });
};

// Update scholarship
export const useUpdateScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/fees/scholarships/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scholarshipKeys.all });
    },
  });
};

// Delete scholarship
export const useDeleteScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fees/scholarships/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scholarshipKeys.all });
    },
  });
};

// Bulk create scholarships
export const useBulkCreateScholarships = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { classId: string; termId: string; discountType: string; discountValue: number; reason?: string }) => {
      const res = await api.post('/fees/scholarships/bulk', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scholarshipKeys.all });
    },
  });
};
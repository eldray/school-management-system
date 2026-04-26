import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Student } from '../types';

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

// Get all students
export const useStudents = () => {
  return useQuery({
    queryKey: studentKeys.lists(),
    queryFn: async () => {
      const res = await api.get('/students');
      return res.data.data as Student[];
    },
  });
};

// Get single student
export const useStudent = (id: string) => {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(`/students/${id}`);
      return res.data.data as Student;
    },
    enabled: !!id,
  });
};

// Activate student
export const useActivateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/students/${id}/activate`);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
};
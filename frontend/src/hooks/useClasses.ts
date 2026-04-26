// frontend/src/hooks/useClasses.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Class, CreateClassData, UpdateClassData } from '../types/class';

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (filters: any) => [...classKeys.lists(), filters] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  statistics: () => [...classKeys.all, 'statistics'] as const,
  teachers: () => [...classKeys.all, 'teachers'] as const,
};

// Get all classes with optional filters
export const useClasses = (filters?: { gradeLevel?: number; hasTeacher?: boolean }) => {
  return useQuery({
    queryKey: classKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.gradeLevel !== undefined) params.append('gradeLevel', String(filters.gradeLevel));
      if (filters?.hasTeacher !== undefined) params.append('hasTeacher', String(filters.hasTeacher));
      const res = await api.get(`/classes?${params.toString()}`);
      return res.data.data as Class[];
    },
  });
};

// Get single class
export const useClass = (id: string) => {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(`/classes/${id}`);
      return res.data.data as Class;
    },
    enabled: !!id,
  });
};

// Get available teachers
export const useAvailableTeachers = () => {
  return useQuery({
    queryKey: classKeys.teachers(),
    queryFn: async () => {
      const res = await api.get('/classes/teachers/available');
      return res.data.data;
    },
  });
};

// Get class statistics
export const useClassStatistics = () => {
  return useQuery({
    queryKey: classKeys.statistics(),
    queryFn: async () => {
      const res = await api.get('/classes/statistics');
      return res.data.data;
    },
  });
};

// Create class
export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassData) => api.post('/classes', data).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.statistics() });
    },
  });
};

// Update class
export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassData }) =>
      api.put(`/classes/${id}`, data).then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.statistics() });
    },
  });
};

// Delete class
export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.statistics() });
    },
  });
};

// Assign teacher
export const useAssignTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, teacherProfileId }: { classId: string; teacherProfileId: string }) =>
      api.post(`/classes/${classId}/assign-teacher`, { teacherProfileId }).then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.statistics() });
    },
  });
};

// Remove teacher
export const useRemoveTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => api.delete(`/classes/${classId}/remove-teacher`).then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.statistics() });
    },
  });
};
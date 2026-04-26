import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Subject } from '../types/class';

export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  list: (includeInactive?: boolean) => [...subjectKeys.lists(), { includeInactive }] as const,
  details: () => [...subjectKeys.all, 'detail'] as const,
  detail: (id: string) => [...subjectKeys.details(), id] as const,
  classSubjects: (classId: string) => [...subjectKeys.all, 'class', classId] as const,
};

// Get all subjects (with optional include inactive)
export const useSubjects = (includeInactive: boolean = false) => {
  return useQuery({
    queryKey: subjectKeys.list(includeInactive),
    queryFn: async () => {
      const params = includeInactive ? '?includeInactive=true' : '';
      const res = await api.get(`/exams/subjects${params}`);
      return res.data.data as Subject[];
    },
  });
};

// Get subjects for a specific class
export const useClassSubjects = (classId: string) => {
  return useQuery({
    queryKey: subjectKeys.classSubjects(classId),
    queryFn: async () => {
      const res = await api.get(`/exams/classes/${classId}/subjects`);
      return res.data.data;
    },
    enabled: !!classId,
  });
};

// Get single subject
export const useSubject = (id: string) => {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(`/exams/subjects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

// Create subject
export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/exams/subjects', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
};

// Update subject
export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/exams/subjects/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
};

// Delete subject (soft delete)
export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/exams/subjects/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
};

// Activate subject
export const useActivateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/exams/subjects/${id}/activate`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
};

// Assign subject to class
export const useAssignSubjectToClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, subjectId }: { classId: string; subjectId: string }) => {
      const res = await api.post('/exams/subjects/assign-to-class', { classId, subjectId });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.classSubjects(variables.classId) });
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
};

// Assign teacher to subject (for a specific class)
export const useAssignTeacherToSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teacherId, subjectId, classId }: { teacherId: string; subjectId: string; classId: string }) => {
      const res = await api.post('/exams/subjects/assign-teacher', { teacherId, subjectId, classId });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.classSubjects(variables.classId) });
    },
  });
};
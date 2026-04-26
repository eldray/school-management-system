import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { AcademicTerm, Subject, Exam, ExamResult } from '../types/exam';
import { useAuth } from '../context/AuthContext';

// Query Keys
export const examKeys = {
  all: ['exams'] as const,
  terms: () => [...examKeys.all, 'terms'] as const,
  subjects: () => [...examKeys.all, 'subjects'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: (filters: any) => [...examKeys.lists(), filters] as const,
  details: () => [...examKeys.all, 'detail'] as const,
  detail: (id: string) => [...examKeys.details(), id] as const,
  results: (studentId?: string, examId?: string) => [...examKeys.all, 'results', { studentId, examId }] as const,
  classResults: (classId: string, examId: string) => [...examKeys.all, 'classResults', classId, examId] as const,
};

// ============================================
// TERMS
// ============================================

export const useTerms = () => {
  return useQuery({
    queryKey: examKeys.terms(),
    queryFn: async () => {
      const res = await api.get('/exams/terms');
      return res.data.data as AcademicTerm[];
    },
  });
};

export const useCreateTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/exams/terms', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.terms() });
    },
  });
};

export const useSetActiveTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/exams/terms/${id}/activate`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.terms() });
    },
  });
};

export const useActiveTerm = () => {
  return useQuery({
    queryKey: [...examKeys.terms(), 'active'],
    queryFn: async () => {
      const res = await api.get('/exams/terms/active');
      return res.data.data as AcademicTerm | null;
    },
  });
};

export const useUpdateTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/exams/terms/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.terms() });
    },
  });
};

export const useDeleteTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/exams/terms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.terms() });
    },
  });
};

// ============================================
// SUBJECTS
// ============================================

// Update useSubjects to accept includeInactive
export const useSubjects = (includeInactive: boolean = false) => {
  return useQuery({
    queryKey: [...examKeys.subjects(), { includeInactive }],
    queryFn: async () => {
      const params = includeInactive ? '?includeInactive=true' : '';
      const res = await api.get(`/exams/subjects${params}`);
      return res.data.data as Subject[];
    },
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/exams/subjects', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.subjects() });
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
      queryClient.invalidateQueries({ queryKey: examKeys.subjects() });
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
      queryClient.invalidateQueries({ queryKey: examKeys.subjects() });
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
      queryClient.invalidateQueries({ queryKey: examKeys.subjects() });
    },
  });
};

// ============================================
// EXAMS
// ============================================

export const useExams = (filters?: { termId?: string }) => {
  return useQuery({
    queryKey: examKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.termId) params.append('termId', filters.termId);
      const res = await api.get(`/exams?${params.toString()}`);
      return res.data.data as Exam[];
    },
  });
};

export const useExam = (id: string) => {
  return useQuery({
    queryKey: examKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(`/exams/${id}`);
      return res.data.data as Exam;
    },
    enabled: !!id,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      // FIXED: POST to /exams, not /exams/add
      const res = await api.post('/exams', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
  });
};

export const usePublishExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/exams/${id}/publish`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: examKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
  });
};


export const useTeacherExamOptions = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  
  return useQuery({
    queryKey: [...examKeys.all, 'teacher-options'],
    queryFn: async () => {
      const res = await api.get('/exams/teacher-options');
      return res.data.data as {
        classTeacherClasses: Array<{
          id: string;
          name: string;
          subjects: Array<{ id: string; name: string; code: string }>;
        }>;
        subjectTeacherOptions: Array<{
          classId: string;
          className: string;
          subjectId: string;
          subjectName: string;
          subjectCode: string;
        }>;
      };
    },
    enabled: isTeacher, // Only run for teachers
  });
};

// ============================================
// RESULTS
// ============================================

export const useStudentResults = (studentId: string, examId?: string) => {
  return useQuery({
    queryKey: examKeys.results(studentId, examId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (examId) params.append('examId', examId);
      const res = await api.get(`/exams/students/${studentId}/results?${params.toString()}`);
      return res.data.data as ExamResult[];
    },
    enabled: !!studentId,
  });
};

export const useClassResults = (classId: string, examId: string) => {
  return useQuery({
    queryKey: examKeys.classResults(classId, examId),
    queryFn: async () => {
      const res = await api.get(`/exams/classes/${classId}/exams/${examId}/results`);
      return res.data.data;
    },
    enabled: !!classId && !!examId,
  });
};

export const useRecordResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { examId: string; studentId: string; marksObtained: number }) => {
      // FIXED: examId not examPaperId
      const res = await api.post('/exams/results', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.all });
    },
  });
};
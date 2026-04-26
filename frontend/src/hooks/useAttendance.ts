import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext'; // Add this import

export const attendanceKeys = {
  all: ['attendance'] as const,
  class: (classId: string, date: string) => [...attendanceKeys.all, 'class', classId, date] as const,
  student: (studentId: string) => [...attendanceKeys.all, 'student', studentId] as const,
};

export const useClassAttendance = (classId: string, date: string) => {
  return useQuery({
    queryKey: attendanceKeys.class(classId, date),
    queryFn: async () => {
      if (!classId) return [];
      const res = await api.get(`/attendance/class/${classId}?date=${date}`);
      return res.data.data;
    },
    enabled: !!classId,
  });
};

export const useStudentAttendance = (studentId: string) => {
  return useQuery({
    queryKey: attendanceKeys.student(studentId),
    queryFn: async () => {
      const res = await api.get(`/attendance/student/${studentId}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });
};

export const useMarkBulkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/attendance/mark/bulk', data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.class(variables.classId, variables.date) });
    },
  });
};

// Get student attendance stats
export const useStudentAttendanceStats = (studentId: string, termId?: string) => {
  return useQuery({
    queryKey: ['student-attendance-stats', studentId, termId],
    queryFn: async () => {
      const params = termId ? `?termId=${termId}` : '';
      const res = await api.get(`/attendance/student/${studentId}/stats${params}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });
};

// Get teacher accessible classes (with permissions)
export const useTeacherAccessibleClasses = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  
  return useQuery({
    queryKey: ['teacher-accessible-classes'],
    queryFn: async () => {
      const res = await api.get('/classes/teacher/accessible');
      return res.data.data;
    },
    enabled: isTeacher,
  });
};
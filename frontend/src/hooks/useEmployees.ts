import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '../types/employee';

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: any) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  statistics: () => [...employeeKeys.all, 'statistics'] as const,
  subjects: () => [...employeeKeys.all, 'subjects'] as const,
  classes: (employeeId: string) => [...employeeKeys.detail(employeeId), 'classes'] as const,
};

// Get all employees
export const useEmployees = (filters?: { employeeType?: string; isActive?: boolean; department?: string }) => {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.employeeType) params.append('employeeType', filters.employeeType);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.department) params.append('department', filters.department);
      const res = await api.get(`/employees?${params.toString()}`);
      return res.data.data as Employee[];
    },
  });
};

// Get single employee
export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => api.get(`/employees/${id}`).then(res => res.data.data),
    enabled: !!id,
  });
};

// Get employee's classes
export const useEmployeeClasses = (employeeId: string) => {
  return useQuery({
    queryKey: employeeKeys.classes(employeeId),
    queryFn: () => api.get(`/employees/${employeeId}/classes`).then(res => res.data.data),
    enabled: !!employeeId,
  });
};

// Get employee statistics
export const useEmployeeStatistics = () => {
  return useQuery({
    queryKey: employeeKeys.statistics(),
    queryFn: () => api.get('/employees/statistics').then(res => res.data.data),
  });
};

// Get available subjects
export const useAvailableSubjects = () => {
  return useQuery({
    queryKey: employeeKeys.subjects(),
    queryFn: () => api.get('/employees/subjects').then(res => res.data.data),
  });
};

// Create employee
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeData) => api.post('/employees', data).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.subjects() });
    },
  });
};

// Update employee
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeData }) =>
      api.put(`/employees/${id}`, data).then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.statistics() });
    },
  });
};

// Delete employee
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.statistics() });
    },
  });
};

// Activate employee
export const useActivateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/employees/${id}/activate`).then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.statistics() });
    },
  });
};
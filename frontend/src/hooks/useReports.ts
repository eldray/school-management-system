import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import { DateRangeFilter } from '../types/reports';

export const reportKeys = {
  dashboard: ['reports', 'dashboard'] as const,
  students: (filters?: DateRangeFilter) => ['reports', 'students', filters] as const,
  employees: (filters?: any) => ['reports', 'employees', filters] as const,
  finances: (filters?: DateRangeFilter) => ['reports', 'finances', filters] as const,
  academics: (filters?: DateRangeFilter) => ['reports', 'academics', filters] as const,
  attendance: (filters?: DateRangeFilter) => ['reports', 'attendance', filters] as const,
};

// Dashboard Stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: reportKeys.dashboard,
    queryFn: () => reportService.getDashboardStats(),
  });
};

// Student Reports
export const useStudentReport = (filters?: DateRangeFilter) => {
  return useQuery({
    queryKey: reportKeys.students(filters),
    queryFn: () => reportService.getStudentReport(filters),
    enabled: true,
  });
};

// Employee Reports (Unified - replaces useTeacherReport)
export const useEmployeeReport = (filters?: { employeeType?: string; department?: string }) => {
  return useQuery({
    queryKey: reportKeys.employees(filters),
    queryFn: () => reportService.getEmployeeReport(filters),
    enabled: true,
  });
};

// Financial Reports
export const useFinancialReport = (filters?: DateRangeFilter) => {
  return useQuery({
    queryKey: reportKeys.finances(filters),
    queryFn: () => reportService.getFinancialReport(filters),
    enabled: true,
  });
};

// Academic Reports
export const useAcademicReport = (filters?: DateRangeFilter) => {
  return useQuery({
    queryKey: reportKeys.academics(filters),
    queryFn: () => reportService.getAcademicReport(filters),
    enabled: true,
  });
};

// Attendance Reports
export const useAttendanceReport = (filters?: DateRangeFilter) => {
  return useQuery({
    queryKey: reportKeys.attendance(filters),
    queryFn: () => reportService.getAttendanceReport(filters),
    enabled: true,
  });
};

// Export Mutations
export const useExportStudentReport = () => {
  return useMutation({
    mutationFn: (filters?: DateRangeFilter) => reportService.exportStudentReport(filters),
  });
};

export const useExportEmployeeReport = () => {
  return useMutation({
    mutationFn: (filters?: { employeeType?: string; department?: string }) => 
      reportService.exportEmployeeReport(filters),
  });
};

export const useExportFinancialReport = () => {
  return useMutation({
    mutationFn: (filters?: DateRangeFilter) => reportService.exportFinancialReport(filters),
  });
};

export const useExportAcademicReport = () => {
  return useMutation({
    mutationFn: (filters?: DateRangeFilter) => reportService.exportAcademicReport(filters),
  });
};

export const useExportAttendanceReport = () => {
  return useMutation({
    mutationFn: (filters?: DateRangeFilter) => reportService.exportAttendanceReport(filters),
  });
};
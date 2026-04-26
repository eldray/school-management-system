import api from '../lib/api';
import { 
  DashboardStats, 
  StudentReport, 
  EmployeeReport, 
  FinancialReport, 
  AcademicReport, 
  AttendanceReport,
  DateRangeFilter 
} from '../types/reports';

export const reportService = {
  // Dashboard Overview
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/reports/dashboard');
    return res.data.data;
  },

  // Student Reports
  getStudentReport: async (filters?: DateRangeFilter): Promise<StudentReport> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    const res = await api.get(`/reports/students?${params.toString()}`);
    return res.data.data;
  },

  exportStudentReport: async (filters?: DateRangeFilter): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    const res = await api.get(`/reports/students/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Employee Reports (Unified - replaces Teacher Reports)
  getEmployeeReport: async (filters?: { employeeType?: string; department?: string }): Promise<EmployeeReport> => {
    const params = new URLSearchParams();
    if (filters?.employeeType) params.append('employeeType', filters.employeeType);
    if (filters?.department) params.append('department', filters.department);
    const res = await api.get(`/reports/employees?${params.toString()}`);
    return res.data.data;
  },

  exportEmployeeReport: async (filters?: { employeeType?: string; department?: string }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.employeeType) params.append('employeeType', filters.employeeType);
    if (filters?.department) params.append('department', filters.department);
    const res = await api.get(`/reports/employees/export?${params.toString()}`, { 
      responseType: 'blob' 
    });
    return res.data;
  },

  // Financial Reports
  getFinancialReport: async (filters?: DateRangeFilter): Promise<FinancialReport> => {
    const params = new URLSearchParams();
    if (filters?.termId) params.append('termId', filters.termId);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const res = await api.get(`/reports/finances?${params.toString()}`);
    return res.data.data;
  },

  exportFinancialReport: async (filters?: DateRangeFilter): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.termId) params.append('termId', filters.termId);
    if (filters?.classId) params.append('classId', filters.classId);
    const res = await api.get(`/reports/finances/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Academic Reports
  getAcademicReport: async (filters?: DateRangeFilter): Promise<AcademicReport> => {
    const params = new URLSearchParams();
    if (filters?.termId) params.append('termId', filters.termId);
    if (filters?.classId) params.append('classId', filters.classId);
    const res = await api.get(`/reports/academics?${params.toString()}`);
    return res.data.data;
  },

  exportAcademicReport: async (filters?: DateRangeFilter): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.termId) params.append('termId', filters.termId);
    if (filters?.classId) params.append('classId', filters.classId);
    const res = await api.get(`/reports/academics/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Attendance Reports
  getAttendanceReport: async (filters?: DateRangeFilter): Promise<AttendanceReport> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const res = await api.get(`/reports/attendance?${params.toString()}`);
    return res.data.data;
  },

  exportAttendanceReport: async (filters?: DateRangeFilter): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const res = await api.get(`/reports/attendance/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
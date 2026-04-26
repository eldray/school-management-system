import api from '../lib/api';

export const staffService = {
  // Staff CRUD
  getAll: (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/staff?${params}`).then(res => res.data.data);
  },
  getById: (id: string) => api.get(`/staff/${id}`).then(res => res.data.data),
  create: (data: any) => api.post('/staff', data).then(res => res.data.data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data).then(res => res.data.data),
  delete: (id: string) => api.delete(`/staff/${id}`).then(res => res.data.data),
  
  // Leave
  getPendingLeaves: () => api.get('/staff/leaves/pending').then(res => res.data.data),
  getStaffLeaves: (staffId: string) => api.get(`/staff/${staffId}/leaves`).then(res => res.data.data),
  requestLeave: (data: any) => api.post('/staff/leaves', data).then(res => res.data.data),
  approveLeave: (leaveId: string, remarks?: string) => 
    api.put(`/staff/leaves/${leaveId}/approve`, { remarks }).then(res => res.data.data),
  rejectLeave: (leaveId: string, remarks?: string) => 
    api.put(`/staff/leaves/${leaveId}/reject`, { remarks }).then(res => res.data.data),
  
  // Payroll
  getPayslips: (staffId: string, year?: number) => {
    const params = year ? `?year=${year}` : '';
    return api.get(`/staff/payslips/${staffId}${params}`).then(res => res.data.data);
  },
  generatePayslip: (data: any) => api.post('/staff/payslips/generate', data).then(res => res.data.data),
  markPayslipPaid: (payslipId: string) => api.put(`/staff/payslips/${payslipId}/pay`).then(res => res.data.data),
};
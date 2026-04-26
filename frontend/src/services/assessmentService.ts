import api from '../lib/api';

export const assessmentService = {
  // Types
  getTypes: () => api.get('/assessments/types').then(res => res.data.data),
  createType: (data: any) => api.post('/assessments/types', data).then(res => res.data.data),
  
  // Assessments
  getAll: (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/assessments?${params}`).then(res => res.data.data);
  },
  getById: (id: string) => api.get(`/assessments/${id}`).then(res => res.data.data),
  create: (data: any) => api.post('/assessments', data).then(res => res.data.data),
  update: (id: string, data: any) => api.put(`/assessments/${id}`, data).then(res => res.data.data),
  delete: (id: string) => api.delete(`/assessments/${id}`).then(res => res.data.data),
  
  // Scores
  getScores: (assessmentId: string) => api.get(`/assessments/${assessmentId}/scores`).then(res => res.data.data),
  recordScores: (assessmentId: string, scores: any[]) => 
    api.post(`/assessments/${assessmentId}/scores`, { scores }).then(res => res.data.data),
  getStudentScores: (studentId: string, termId?: string) => {
    const params = termId ? `?termId=${termId}` : '';
    return api.get(`/assessments/student/${studentId}/scores${params}`).then(res => res.data.data);
  },
};
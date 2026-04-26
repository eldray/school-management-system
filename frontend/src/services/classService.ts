import api from '../lib/api';
import { Class, CreateClassData, Teacher, ClassStatistics } from '../types/class';

export const classService = {
  // Get all classes
  getAllClasses: async (filters?: { gradeLevel?: number; hasTeacher?: boolean }): Promise<Class[]> => {
    const params = new URLSearchParams();
    if (filters?.gradeLevel) params.append('gradeLevel', String(filters.gradeLevel));
    if (filters?.hasTeacher !== undefined) params.append('hasTeacher', String(filters.hasTeacher));
    
    const response = await api.get(`/classes?${params.toString()}`);
    return response.data.data;
  },

  // Get class by ID
  getClassById: async (id: string): Promise<Class> => {
    const response = await api.get(`/classes/${id}`);
    return response.data.data;
  },

  // Create class
  createClass: async (data: CreateClassData): Promise<Class> => {
    const response = await api.post('/classes', data);
    return response.data.data;
  },

  // Update class
  updateClass: async (id: string, data: Partial<CreateClassData>): Promise<Class> => {
    const response = await api.put(`/classes/${id}`, data);
    return response.data.data;
  },

  // Delete class
  deleteClass: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },

  // Get available teachers
  getAvailableTeachers: async (): Promise<Teacher[]> => {
    const response = await api.get('/classes/teachers/available');
    return response.data.data;
  },

  // Assign teacher to class
  assignTeacher: async (classId: string, teacherProfileId: string): Promise<Class> => {
    const response = await api.post(`/classes/${classId}/assign-teacher`, { teacherProfileId });
    return response.data.data;
  },

  // Remove teacher from class
  removeTeacher: async (classId: string): Promise<Class> => {
    const response = await api.delete(`/classes/${classId}/remove-teacher`);
    return response.data.data;
  },

  // Get class statistics
  getStatistics: async (): Promise<ClassStatistics> => {
    const response = await api.get('/classes/statistics');
    return response.data.data;
  },
};
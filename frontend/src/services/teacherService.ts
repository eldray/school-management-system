import api from '../lib/api';
import { Teacher, CreateTeacherData, UpdateTeacherData, TeacherStatistics, TeacherClass } from '../types/teacher';

export const teacherService = {
  // Get all teachers
  getAllTeachers: async (filters?: { isActive?: boolean; subject?: string }): Promise<Teacher[]> => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.subject) params.append('subject', filters.subject);
    
    const response = await api.get(`/teachers?${params.toString()}`);
    return response.data.data;
  },

  // Get teacher by ID
  getTeacherById: async (id: string): Promise<Teacher> => {
    const response = await api.get(`/teachers/${id}`);
    return response.data.data;
  },

  // Create teacher
  createTeacher: async (data: CreateTeacherData): Promise<Teacher> => {
    const response = await api.post('/teachers', data);
    return response.data.data;
  },

  // Update teacher
  updateTeacher: async (id: string, data: UpdateTeacherData): Promise<Teacher> => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data.data;
  },

  // Delete teacher
  deleteTeacher: async (id: string): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },

  // Get teacher's classes
  getTeacherClasses: async (teacherId: string): Promise<TeacherClass[]> => {
    const response = await api.get(`/teachers/${teacherId}/classes`);
    return response.data.data;
  },

  // Get teacher statistics
  getStatistics: async (): Promise<TeacherStatistics> => {
    const response = await api.get('/teachers/statistics');
    return response.data.data;
  },

  // Get available subjects
  getSubjects: async (): Promise<string[]> => {
    const response = await api.get('/teachers/subjects');
    return response.data.data;
  },

  activateTeacher: async (id: string): Promise<Teacher> => {
    const res = await api.patch(`/teachers/${id}/activate`);
    return res.data.data;
  },
};
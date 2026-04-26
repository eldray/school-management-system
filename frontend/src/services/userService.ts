import api from '../lib/api';
import { User, CreateUserData, UpdateUserData, UsersResponse, UserResponse } from '../types/user';

export const userService = {
  // Get all users
  getAllUsers: async (filters?: { role?: string; isActive?: boolean }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    
    const response = await api.get<UsersResponse>(`/users?${params.toString()}`);
    return response.data.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<UserResponse>(`/users/${id}`);
    return response.data.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<UserResponse>('/users/profile');
    return response.data.data;
  },

  // Create new user
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post<UserResponse>('/users', data);
    return response.data.data;
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await api.put<UserResponse>(`/users/${id}`, data);
    return response.data.data;
  },

  // Delete/deactivate user
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
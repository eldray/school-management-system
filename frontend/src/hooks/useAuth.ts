import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth as useAuthContext } from '../context/AuthContext';
import { User } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const useLogin = () => {
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const { data } = await axios.post<LoginResponse>(
          `${API_URL}/auth/login`, 
          credentials
        );
        
        if (!data.success) {
          throw new Error(data.message || 'Login failed');
        }
        
        return data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || 'Network error');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Store user data and token
      login(data.data.user, data.data.token);
      
      // Set default axios header for future authenticated requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    },
  });
};
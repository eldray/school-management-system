import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { SchoolSettings } from '../types/school';

export const schoolKeys = {
  settings: ['school', 'settings'] as const,
};

export const useSchoolSettings = () => {
  return useQuery({
    queryKey: schoolKeys.settings,
    queryFn: async () => {
      const res = await api.get('/school/settings');
      return res.data.data as SchoolSettings;
    },
  });
};

export const useUpdateSchoolSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SchoolSettings>) => {
      const res = await api.put('/school/settings', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolKeys.settings });
    },
  });
};
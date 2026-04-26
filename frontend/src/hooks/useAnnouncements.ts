import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Announcement, CreateAnnouncementInput } from '../types/announcement';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  detail: (id: string) => [...announcementKeys.all, id] as const,
  unreadCount: () => [...announcementKeys.all, 'unread'] as const,
};

export const useAnnouncements = () => {
  return useQuery({
    queryKey: announcementKeys.lists(),
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data.data as Announcement[];
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: announcementKeys.unreadCount(),
    queryFn: async () => {
      const res = await api.get('/announcements/unread-count');
      return res.data.data.count as number;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAnnouncementInput) => {
      const res = await api.post('/announcements', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.unreadCount() });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/announcements/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.unreadCount() });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.unreadCount() });
    },
  });
};
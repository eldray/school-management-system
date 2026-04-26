import { Request, Response } from 'express';
import * as announcementService from '../services/announcement.service.js';

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const announcement = await announcementService.createAnnouncement({
      ...req.body,
      authorId: user.id,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (error: any) {
    console.error('Create announcement error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const announcements = await announcementService.getAllAnnouncements(user.id, user.role);
    res.status(200).json({ success: true, data: announcements });
  } catch (error: any) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const announcement = await announcementService.getAnnouncementById(id, user.id);
    
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    
    res.status(200).json({ success: true, data: announcement });
  } catch (error: any) {
    console.error('Get announcement error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    await announcementService.markAsRead(id, user.id);
    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const count = await announcementService.getUnreadCount(user.id, user.role);
    res.status(200).json({ success: true, data: { count } });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.updateAnnouncement(id, req.body);
    res.status(200).json({ success: true, data: announcement });
  } catch (error: any) {
    console.error('Update announcement error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await announcementService.deleteAnnouncement(id);
    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
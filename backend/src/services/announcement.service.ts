import prisma from '../config/prisma.js';
import { Priority, Audience } from '@prisma/client';

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: Priority;
  audience?: Audience;
  classId?: string;
  authorId: string;
}

export const createAnnouncement = async (data: CreateAnnouncementInput) => {
  return prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      priority: data.priority || 'MEDIUM',
      audience: data.audience || 'ALL',
      classId: data.classId,
      authorId: data.authorId,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
    },
  });
};

export const getAllAnnouncements = async (userId: string, userRole: string) => {
  const where: any = {};
  
  if (userRole === 'STUDENT') {
    where.OR = [
      { audience: 'ALL' },
      { audience: 'STUDENTS' },
    ];
  } else if (userRole === 'PARENT') {
    where.OR = [
      { audience: 'ALL' },
      { audience: 'PARENTS' },
    ];
  } else if (userRole === 'TEACHER') {
    where.OR = [
      { audience: 'ALL' },
      { audience: 'STAFF' },
    ];
  }

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
      reads: {
        where: { userId },
        select: { readAt: true },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return announcements.map(a => ({
    ...a,
    isRead: a.reads.length > 0,
  }));
};

export const getAnnouncementById = async (id: string, userId: string) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
      reads: {
        where: { userId },
        select: { readAt: true },
      },
    },
  });

  if (!announcement) return null;

  return {
    ...announcement,
    isRead: announcement.reads.length > 0,
  };
};

export const markAsRead = async (announcementId: string, userId: string) => {
  try {
    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Then verify the announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    
    if (!announcement) {
      throw new Error('Announcement not found');
    }
    
    return await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: { announcementId, userId },
      },
      update: {},
      create: {
        announcementId,
        userId,
      },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

export const getUnreadCount = async (userId: string, userRole: string) => {
  const where: any = {};
  
  if (userRole === 'STUDENT') {
    where.OR = [{ audience: 'ALL' }, { audience: 'STUDENTS' }];
  } else if (userRole === 'PARENT') {
    where.OR = [{ audience: 'ALL' }, { audience: 'PARENTS' }];
  } else if (userRole === 'TEACHER') {
    where.OR = [{ audience: 'ALL' }, { audience: 'STAFF' }];
  }

  const totalAnnouncements = await prisma.announcement.count({ where });
  
  const readAnnouncements = await prisma.announcementRead.count({
    where: {
      userId,
      announcement: where,
    },
  });

  return totalAnnouncements - readAnnouncements;
};

export const updateAnnouncement = async (id: string, data: Partial<CreateAnnouncementInput>) => {
  return prisma.announcement.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      priority: data.priority,
      audience: data.audience,
      classId: data.classId,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
    },
  });
};

export const deleteAnnouncement = async (id: string) => {
  return prisma.announcement.delete({ where: { id } });
};
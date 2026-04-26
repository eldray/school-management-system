export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  audience: 'ALL' | 'STAFF' | 'STUDENTS' | 'PARENTS' | 'CLASS';
  classId?: string;
  authorId: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  class?: {
    id: string;
    name: string;
  };
  reads?: AnnouncementRead[];
  isRead?: boolean;  // Computed field for current user
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementRead {
  id: string;
  announcementId: string;
  userId: string;
  readAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  audience?: 'ALL' | 'STAFF' | 'STUDENTS' | 'PARENTS' | 'CLASS';
  classId?: string;
}
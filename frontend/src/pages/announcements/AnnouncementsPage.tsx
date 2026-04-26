import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Megaphone, Loader2, Trash2, Edit, X, CheckCircle, Circle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAnnouncements, useDeleteAnnouncement, useMarkAsRead } from '../../hooks/useAnnouncements';
import { useAuth } from '../../context/AuthContext';
import { Announcement } from '../../types/announcement';

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

const audienceLabels: Record<string, string> = {
  ALL: 'Everyone',
  STAFF: 'Staff Only',
  STUDENTS: 'Students Only',
  PARENTS: 'Parents Only',
  CLASS: 'Specific Class',
};

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState<Announcement | null>(null);
  
  const { data: announcements = [], isLoading } = useAnnouncements();
  const deleteAnnouncement = useDeleteAnnouncement();
  const markAsRead = useMarkAsRead();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER';
  const canDelete = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleViewAnnouncement = (announcement: Announcement) => {
    if (!announcement.isRead) {
      markAsRead.mutate(announcement.id);
    }
    // For now, just mark as read since we don't have a detail page
    // You can add a detail modal or page later
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await deleteAnnouncement.mutateAsync(showDeleteModal.id);
      setShowDeleteModal(null);
    } catch (error: any) {
      alert('Failed to delete announcement');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = announcements.filter(a => !a.isRead).length;
  const totalCount = announcements.length;

  return (
    <DashboardLayout title="Announcements">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
            <p className="text-gray-500 text-sm mt-1">
              Stay updated with the latest news and announcements
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  <Circle className="w-2 h-2 fill-red-500" />
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => navigate('/announcements/add')}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Plus className="w-4 h-4" />
              Post Announcement
            </button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{totalCount} total</span>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 fill-red-500 text-red-500" />
              <span className="text-gray-600">{unreadCount} unread</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">{totalCount - unreadCount} read</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
          {(priorityFilter !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setPriorityFilter('ALL');
                setSearchTerm('');
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No announcements yet</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || priorityFilter !== 'ALL' 
                ? 'No announcements match your filters'
                : 'Stay tuned for updates and news'}
            </p>
            {canManage && !searchTerm && priorityFilter === 'ALL' && (
              <button
                onClick={() => navigate('/announcements/add')}
                className="text-[#1a3d30] hover:underline"
              >
                Post the first announcement
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => handleViewAnnouncement(announcement)}
                className={`bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  announcement.priority === 'HIGH' ? 'border-l-red-500' :
                  announcement.priority === 'MEDIUM' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                } ${!announcement.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Unread indicator */}
                        {!announcement.isRead && (
                          <Circle className="w-3 h-3 fill-blue-500 text-blue-500" />
                        )}
                        <h3 className={`text-lg font-semibold ${!announcement.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {announcement.title}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${priorityColors[announcement.priority]}`}>
                          {announcement.priority}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {audienceLabels[announcement.audience]}
                          {announcement.audience === 'CLASS' && announcement.class && `: ${announcement.class.name}`}
                        </span>
                        {announcement.isRead && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className={`leading-relaxed whitespace-pre-wrap ${!announcement.isRead ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                        {announcement.content}
                      </p>
                    </div>
                    
                    {(canManage || canDelete) && (
                      <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                        {canManage && announcement.authorId === user?.id && (
                          <button
                            onClick={() => navigate(`/announcements/${announcement.id}/edit`)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setShowDeleteModal(announcement)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-[#1a3d30] to-[#2a5d50] rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {announcement.author?.firstName?.[0]}{announcement.author?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {announcement.author?.firstName} {announcement.author?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Posted on {formatDate(announcement.createdAt)} at {formatTime(announcement.createdAt)}
                        </p>
                      </div>
                    </div>
                    {!announcement.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead.mutate(announcement.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Announcement</h3>
              </div>
              <p className="text-gray-500 mb-2">
                Are you sure you want to delete this announcement?
              </p>
              <p className="text-sm font-medium text-gray-700 mb-6">
                "{showDeleteModal.title}"
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteAnnouncement.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteAnnouncement.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
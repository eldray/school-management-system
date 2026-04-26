import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Megaphone } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCreateAnnouncement } from '../../hooks/useAnnouncements';
import { useClasses } from '../../hooks/useClasses';
import { CreateAnnouncementInput } from '../../types/announcement';

export default function AddAnnouncementPage() {
  const navigate = useNavigate();
  const { data: classes = [] } = useClasses();
  const createAnnouncement = useCreateAnnouncement();

  const [form, setForm] = useState<CreateAnnouncementInput>({
    title: '',
    content: '',
    priority: 'MEDIUM',
    audience: 'ALL',
    classId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAnnouncement.mutateAsync(form);
      navigate('/announcements');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to post announcement');
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Post Announcement">
      <button onClick={() => navigate('/announcements')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Announcements
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#1a3d30]/10 rounded-full flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[#1a3d30]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Post New Announcement</h2>
            <p className="text-gray-500 text-sm">Share news and updates with the school community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              type="text"
              placeholder="e.g., Important: Parent-Teacher Meeting"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Message *</label>
            <textarea
              placeholder="Write your announcement here..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className={`${inputCls} resize-none h-40`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className={inputCls}
              >
                <option value="LOW">🟢 Low - General information</option>
                <option value="MEDIUM">🟡 Medium - Important update</option>
                <option value="HIGH">🔴 High - Urgent attention required</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value as any })}
                className={inputCls}
              >
                <option value="ALL">👥 Everyone</option>
                <option value="STAFF">👨‍🏫 Staff Only</option>
                <option value="STUDENTS">🎓 Students Only</option>
                <option value="PARENTS">👪 Parents Only</option>
                <option value="CLASS">📚 Specific Class</option>
              </select>
            </div>
          </div>

          {form.audience === 'CLASS' && (
            <div>
              <label className={labelCls}>Select Class *</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className={inputCls}
                required={form.audience === 'CLASS'}
              >
                <option value="">Select a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/announcements')}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAnnouncement.isPending}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
            >
              {createAnnouncement.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Post Announcement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
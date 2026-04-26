import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, BookOpen, UserCheck, Loader2, X, Save, Library } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useClasses, useDeleteClass, useUpdateClass, useAvailableTeachers } from '../../hooks/useClasses';
import { useAuth } from '../../context/AuthContext';
import { useClassSubjects } from '../../hooks/useSubjects';
import { Class } from '../../types/class';

const gradeLevels = [
  { value: 0, label: 'Kindergarten / Pre-School' },
  { value: 1, label: 'Grade 1' },
  { value: 2, label: 'Grade 2' },
  { value: 3, label: 'Grade 3' },
  { value: 4, label: 'Grade 4' },
  { value: 5, label: 'Grade 5' },
  { value: 6, label: 'Grade 6' },
  { value: 7, label: 'JHS 1 / Grade 7' },
  { value: 8, label: 'JHS 2 / Grade 8' },
  { value: 9, label: 'JHS 3 / Grade 9' },
  { value: 10, label: 'SHS 1 / Grade 10' },
  { value: 11, label: 'SHS 2 / Grade 11' },
  { value: 12, label: 'SHS 3 / Grade 12' },
];

export default function ClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editForm, setEditForm] = useState({ name: '', gradeLevel: 1, stream: '', teacherProfileId: '' });
  
  const { data: classes = [], isLoading } = useClasses();
  const { data: teachers = [] } = useAvailableTeachers();
  const deleteClass = useDeleteClass();
  const updateClass = useUpdateClass();

  const canManageClasses = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || cls.gradeLevel === parseInt(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteClass.mutateAsync(id);
      setShowDeleteModal(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete class');
    }
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setEditForm({
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      stream: cls.stream || '',
      teacherProfileId: cls.teacherProfile?.id || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    
    try {
      await updateClass.mutateAsync({ id: editingClass.id, data: editForm });
      setEditingClass(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update class');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Classes">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Classes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage classes, assign teachers, and view student rosters
            </p>
          </div>
          {canManageClasses && (
            <button
              onClick={() => navigate('/classes/add')}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classes.reduce((sum, c) => sum + c.studentCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Classes with Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classes.filter(c => c.teacherProfile).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Library className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classes.reduce((sum, c) => sum + (c.subjectCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3d30]"
            />
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="ALL">All Grades</option>
            {gradeLevels.map(grade => (
              <option key={grade.value} value={grade.value}>{grade.label}</option>
            ))}
          </select>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div 
                className="cursor-pointer"
                onClick={() => navigate(`/classes/${cls.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{cls.name}</h3>
                    <p className="text-sm text-gray-500">
                      {gradeLevels.find(g => g.value === cls.gradeLevel)?.label || `Grade ${cls.gradeLevel}`}
                      {cls.stream && ` • ${cls.stream}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {cls.studentCount} students
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    {cls.teacherProfile ? (
                      <span className="text-gray-700">
                        {cls.teacherProfile.user.firstName} {cls.teacherProfile.user.lastName}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">No teacher assigned</span>
                    )}
                  </div>
                  
                  {/* Subjects Summary */}
                  <div className="flex items-center gap-2 text-sm">
                    <Library className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {cls.subjectCount || 0} subject{(cls.subjectCount || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Subject Tags Preview */}
                  {cls.subjects && cls.subjects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cls.subjects.slice(0, 3).map((subject, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {subject.name}
                        </span>
                      ))}
                      {cls.subjects.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          +{cls.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {canManageClasses && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(cls);
                    }}
                    className="flex-1 text-sm text-gray-600 hover:text-gray-900 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(cls.id);
                    }}
                    className="flex-1 text-sm text-red-600 hover:text-red-700 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No classes found</p>
          </div>
        )}

        {/* Edit Modal */}
        {editingClass && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
                <button
                  onClick={() => setEditingClass(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Level *</label>
                  <select
                    value={editForm.gradeLevel}
                    onChange={(e) => setEditForm({ ...editForm, gradeLevel: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                    required
                  >
                    {gradeLevels.map(grade => (
                      <option key={grade.value} value={grade.value}>{grade.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stream (Optional)</label>
                  <input
                    type="text"
                    value={editForm.stream}
                    onChange={(e) => setEditForm({ ...editForm, stream: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Teacher</label>
                  <select
                    value={editForm.teacherProfileId}
                    onChange={(e) => setEditForm({ ...editForm, teacherProfileId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                  >
                    <option value="">No teacher assigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user.firstName} {teacher.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateClass.isPending}
                    className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updateClass.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Class</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this class? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={deleteClass.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteClass.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
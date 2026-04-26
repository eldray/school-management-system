import { useState } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2, Loader2, X, Save, Users, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, useActivateSubject } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';
import { Subject } from '../../types/exam';

export default function SubjectsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Subject | null>(null);
  const [showActivateModal, setShowActivateModal] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    category: 'Core',
  });

  const { data: subjects = [], isLoading } = useSubjects(showInactive);
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const activateSubject = useActivateSubject();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSubjects = subjects.filter(s => s.isActive !== false);
  const inactiveSubjects = subjects.filter(s => s.isActive === false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.id, data: form });
      } else {
        await createSubject.mutateAsync(form);
      }
      setShowAddModal(false);
      setEditingSubject(null);
      setForm({ name: '', code: '', description: '', category: 'Core' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await deleteSubject.mutateAsync(showDeleteModal.id);
      setShowDeleteModal(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to deactivate subject');
    }
  };

  const handleActivate = async () => {
    if (!showActivateModal) return;
    try {
      await activateSubject.mutateAsync(showActivateModal.id);
      setShowActivateModal(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to activate subject');
    }
  };

  const categories = ['Core', 'Elective', 'Practical', 'Vocational'];
  const categoryColors: Record<string, string> = {
    Core: 'bg-blue-100 text-blue-700',
    Elective: 'bg-green-100 text-green-700',
    Practical: 'bg-purple-100 text-purple-700',
    Vocational: 'bg-orange-100 text-orange-700',
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  if (isLoading) {
    return (
      <DashboardLayout title="Subjects">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Subjects">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subjects</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage subjects offered in the school
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-[#1a3d30] rounded"
              />
              <span className="text-sm text-gray-600">Show inactive</span>
            </label>
            {canManage && (
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setForm({ name: '', code: '', description: '', category: 'Core' });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total Subjects</p>
            <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Active Subjects</p>
            <p className="text-2xl font-bold text-green-600">{activeSubjects.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-400">{inactiveSubjects.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Core Subjects</p>
            <p className="text-2xl font-bold text-blue-600">
              {subjects.filter(s => s.category === 'Core').length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className={`bg-white rounded-xl border p-5 transition-shadow ${
                subject.isActive === false ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    subject.isActive === false ? 'bg-gray-100' : 'bg-[#1a3d30]/10'
                  }`}>
                    <BookOpen className={`w-5 h-5 ${
                      subject.isActive === false ? 'text-gray-400' : 'text-[#1a3d30]'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${subject.isActive === false ? 'text-gray-500' : 'text-gray-900'}`}>
                      {subject.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">{subject.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {subject.isActive === false && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">Inactive</span>
                  )}
                  {canManage && (
                    <>
                      <button
                        onClick={() => {
                          setEditingSubject(subject);
                          setForm({
                            name: subject.name,
                            code: subject.code,
                            description: subject.description || '',
                            category: subject.category || 'Core',
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                        disabled={subject.isActive === false}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {subject.isActive === false ? (
                        <button
                          onClick={() => setShowActivateModal(subject)}
                          className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                          title="Activate subject"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowDeleteModal(subject)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                          title="Deactivate subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {subject.description && (
                  <p className={`text-sm line-clamp-2 ${subject.isActive === false ? 'text-gray-400' : 'text-gray-600'}`}>
                    {subject.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[subject.category || 'Core']}`}>
                    {subject.category || 'Core'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>👨‍🏫 {subject._count?.teacherSubjects || 0} teachers</span>
                  <span>📚 {subject._count?.classSubjects || 0} classes</span>
                  <span>📝 {subject._count?.examSubjects || 0} exams</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No subjects found</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Subject Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Subject Code *</label>
                  <input
                    type="text"
                    placeholder="e.g., MATH101"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputCls}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Description (Optional)</label>
                  <textarea
                    placeholder="Brief description of the subject"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputCls} resize-none h-20`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSubject.isPending || updateSubject.isPending}
                    className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {(createSubject.isPending || updateSubject.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingSubject ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deactivate Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Deactivate Subject</h3>
                  <p className="text-sm text-gray-500">This action can be reversed</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-2">
                Are you sure you want to deactivate <span className="font-semibold text-gray-900">{showDeleteModal.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-2">
                The subject will no longer appear in dropdowns for new exams or assignments.
              </p>
              {(showDeleteModal._count?.examSubjects > 0 || showDeleteModal._count?.teacherSubjects > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    This subject has existing data:
                  </p>
                  <ul className="text-xs text-amber-700 mt-2 space-y-1">
                    {showDeleteModal._count?.examSubjects > 0 && (
                      <li>• {showDeleteModal._count.examSubjects} exam(s) recorded</li>
                    )}
                    {showDeleteModal._count?.teacherSubjects > 0 && (
                      <li>• {showDeleteModal._count.teacherSubjects} teacher(s) assigned</li>
                    )}
                  </ul>
                  <p className="text-xs text-amber-700 mt-2">
                    Historical data will be preserved. You can reactivate later.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteSubject.isPending}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteSubject.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Deactivate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activate Confirmation Modal */}
        {showActivateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Activate Subject</h3>
                  <p className="text-sm text-gray-500">Restore subject for use</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-2">
                Are you sure you want to activate <span className="font-semibold text-gray-900">{showActivateModal.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The subject will reappear in dropdowns for new exams and assignments.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowActivateModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivate}
                  disabled={activateSubject.isPending}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {activateSubject.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Activate
                    </>
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
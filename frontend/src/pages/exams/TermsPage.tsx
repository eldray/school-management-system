import { useState } from 'react';
import { Plus, Calendar, Star, Edit, Trash2, Loader2, X, Check } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useTerms, useCreateTerm, useSetActiveTerm, useUpdateTerm, useDeleteTerm } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';

const termTypes = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM'];
const termTypeLabels: Record<string, string> = {
  FIRST_TERM: 'First Term',
  SECOND_TERM: 'Second Term',
  THIRD_TERM: 'Third Term',
};

export default function TermsPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'FIRST_TERM',
    academicYear: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
  });

  const { data: terms = [], isLoading } = useTerms();
  const createTerm = useCreateTerm();
  const setActiveTerm = useSetActiveTerm();
  const updateTerm = useUpdateTerm();
  const deleteTerm = useDeleteTerm();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTerm) {
        await updateTerm.mutateAsync({ id: editingTerm.id, data: form });
      } else {
        await createTerm.mutateAsync(form);
      }
      setShowAddModal(false);
      setEditingTerm(null);
      setForm({ name: '', type: 'FIRST_TERM', academicYear: '', startDate: '', endDate: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save term');
    }
  };

  const openEditModal = (term: any) => {
    setEditingTerm(term);
    setForm({
      name: term.name,
      type: term.type,
      academicYear: term.academicYear,
      startDate: term.startDate.split('T')[0],
      endDate: term.endDate.split('T')[0],
    });
    setShowAddModal(true);
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Academic Terms">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Academic Terms</h2>
            <p className="text-gray-500 text-sm mt-1">Manage school terms and academic years</p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingTerm(null);
                setForm({ name: '', type: 'FIRST_TERM', academicYear: new Date().getFullYear().toString(), startDate: '', endDate: '' });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Plus className="w-4 h-4" /> Add Term
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
          </div>
        ) : (
          <div className="grid gap-4">
            {terms.map((term) => (
              <div
                key={term.id}
                className={`bg-white rounded-xl border p-5 ${term.isActive ? 'border-[#1a3d30] shadow-md' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {term.isActive && <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
                    <div>
                      <h3 className="font-semibold text-gray-900">{term.name}</h3>
                      <p className="text-sm text-gray-500">{termTypeLabels[term.type]} • {term.academicYear}</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      {!term.isActive && (
                        <button
                          onClick={() => setActiveTerm.mutate(term.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Set as active term"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(term)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTerm.mutate(term.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-gray-400">|</div>
                  <div>{term._count?.exams || 0} exams</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTerm ? 'Edit Term' : 'Add New Term'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Term Name</label>
                  <input
                    type="text"
                    placeholder="e.g., First Term 2024/2025"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Term Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className={inputCls}
                      required
                    >
                      {termTypes.map(type => (
                        <option key={type} value={type}>{termTypeLabels[type]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Academic Year</label>
                    <input
                      type="text"
                      placeholder="e.g., 2024/2025"
                      value={form.academicYear}
                      onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
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
                    className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328]"
                  >
                    {editingTerm ? 'Save Changes' : 'Create Term'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
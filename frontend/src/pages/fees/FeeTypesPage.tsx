import { useState } from 'react';
import { Plus, Edit, Trash2, Loader2, X, Save, DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useFeeTypes, useCreateFeeType, useUpdateFeeType, useDeleteFeeType } from '../../hooks/useFees';
import { useAuth } from '../../context/AuthContext';
import { FeeType, FeeCategory } from '../../types/fee';

const categories: FeeCategory[] = ['TUITION', 'PTA', 'CANTEEN', 'SPORTS', 'EXAM', 'LIBRARY', 'ICT', 'UNIFORM', 'TRANSPORT', 'OTHER'];

const categoryColors: Record<string, string> = {
  TUITION: 'bg-blue-100 text-blue-700',
  PTA: 'bg-green-100 text-green-700',
  CANTEEN: 'bg-orange-100 text-orange-700',
  SPORTS: 'bg-purple-100 text-purple-700',
  EXAM: 'bg-red-100 text-red-700',
  LIBRARY: 'bg-indigo-100 text-indigo-700',
  ICT: 'bg-cyan-100 text-cyan-700',
  UNIFORM: 'bg-pink-100 text-pink-700',
  TRANSPORT: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function FeeTypesPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<FeeType | null>(null);
  const [form, setForm] = useState({ name: '', description: '', amount: '', category: 'TUITION' as FeeCategory });

  const { data: feeTypes = [], isLoading } = useFeeTypes();
  const createFeeType = useCreateFeeType();
  const updateFeeType = useUpdateFeeType();
  const deleteFeeType = useDeleteFeeType();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (editingType) {
        await updateFeeType.mutateAsync({ id: editingType.id, data });
      } else {
        await createFeeType.mutateAsync(data);
      }
      setShowModal(false);
      setEditingType(null);
      setForm({ name: '', description: '', amount: '', category: 'TUITION' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save fee type');
    }
  };

  const openEdit = (type: FeeType) => {
    setEditingType(type);
    setForm({
      name: type.name,
      description: type.description || '',
      amount: type.amount.toString(),
      category: type.category,
    });
    setShowModal(true);
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Fee Types">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fee Types</h2>
            <p className="text-gray-500 text-sm mt-1">Manage fee categories and default amounts</p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingType(null);
                setForm({ name: '', description: '', amount: '', category: 'TUITION' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Plus className="w-4 h-4" /> Add Fee Type
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeTypes.map((type) => (
              <div key={type.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${categoryColors[type.category]}`}>
                      {type.category}
                    </span>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(type)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Edit className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => deleteFeeType.mutate(type.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                {type.description && (
                  <p className="text-sm text-gray-500 mb-3">{type.description}</p>
                )}
                <p className="text-2xl font-bold text-gray-900">
                  ₵{type.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">Default Amount</p>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingType ? 'Edit Fee Type' : 'Add Fee Type'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Tuition Fee"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as FeeCategory })}
                    className={inputCls}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Default Amount (₵) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Description (Optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputCls} resize-none h-20`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createFeeType.isPending || updateFeeType.isPending}
                    className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {(createFeeType.isPending || updateFeeType.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingType ? 'Update' : 'Create'}
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
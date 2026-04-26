import { useState } from 'react';
import { Plus, Edit, Trash2, Loader2, X, Save, Users, Percent, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useScholarships, useCreateScholarship, useUpdateScholarship, useDeleteScholarship, useBulkCreateScholarships } from '../../hooks/useScholarships';
import { useTerms } from '../../hooks/useExams';
import { useClasses } from '../../hooks/useClasses';
import { useStudents } from '../../hooks/useStudents';
import { useFeeTypes } from '../../hooks/useFees';

export default function ScholarshipsPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<any>(null);
  const [form, setForm] = useState({
    studentId: '',
    feeTypeId: '',
    termId: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    reason: '',
  });

  const { data: scholarships = [], isLoading } = useScholarships();
  const { data: terms = [] } = useTerms();
  const { data: classes = [] } = useClasses();
  const { data: students = [] } = useStudents();
  const { data: feeTypes = [] } = useFeeTypes();
  const createScholarship = useCreateScholarship();
  const updateScholarship = useUpdateScholarship();
  const deleteScholarship = useDeleteScholarship();
  const bulkCreate = useBulkCreateScholarships();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ACCOUNTANT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        discountValue: parseFloat(form.discountValue),
        feeTypeId: form.feeTypeId || undefined,
      };
      
      if (editingScholarship) {
        await updateScholarship.mutateAsync({ id: editingScholarship.id, data });
      } else {
        await createScholarship.mutateAsync(data);
      }
      setShowModal(false);
      setEditingScholarship(null);
      setForm({ studentId: '', feeTypeId: '', termId: '', discountType: 'PERCENTAGE', discountValue: '', reason: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save scholarship');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this scholarship? The student will pay full fees.')) {
      await deleteScholarship.mutateAsync(id);
    }
  };

  const openEdit = (scholarship: any) => {
    setEditingScholarship(scholarship);
    setForm({
      studentId: scholarship.studentId,
      feeTypeId: scholarship.feeTypeId || '',
      termId: scholarship.termId,
      discountType: scholarship.discountType,
      discountValue: scholarship.discountValue.toString(),
      reason: scholarship.reason || '',
    });
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => `₵${amount.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Scholarships & Discounts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Scholarships & Discounts</h2>
            <p className="text-gray-500 text-sm mt-1">Manage student fee exemptions and discounts</p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <Users className="w-4 h-4" />
                Bulk Discount
              </button>
              <button
                onClick={() => {
                  setEditingScholarship(null);
                  setForm({ studentId: '', feeTypeId: '', termId: '', discountType: 'PERCENTAGE', discountValue: '', reason: '' });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
              >
                <Plus className="w-4 h-4" />
                Add Discount
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" /></div>
        ) : scholarships.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No scholarships or discounts assigned</p>
            <p className="text-sm text-gray-400 mt-1">Add discounts to help students with fee exemptions</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Term</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scholarships.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{s.student?.firstName} {s.student?.lastName}</p>
                      <p className="text-xs text-gray-500">{s.student?.admissionNumber}</p>
                    </td>
                    <td className="py-3 px-4">
                      {s.feeType ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{s.feeType.name}</span>
                      ) : (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">All Fees</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">
                        {s.discountType === 'PERCENTAGE' ? `${s.discountValue}% OFF` : formatCurrency(s.discountValue)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.term?.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{s.reason || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                          <X className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Single Scholarship Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{editingScholarship ? 'Edit Discount' : 'Add Discount'}</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Student *</label>
                  <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className={inputCls} required>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fee Type (Optional - leave empty for all fees)</label>
                  <select value={form.feeTypeId} onChange={e => setForm({ ...form, feeTypeId: e.target.value })} className={inputCls}>
                    <option value="">All Fee Types</option>
                    {feeTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Term *</label>
                  <select value={form.termId} onChange={e => setForm({ ...form, termId: e.target.value })} className={inputCls} required>
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academicYear})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Discount Type</label>
                    <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className={inputCls}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₵)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Value</label>
                    <input type="number" step="0.01" min="0" placeholder={form.discountType === 'PERCENTAGE' ? 'e.g., 50' : 'e.g., 500'} value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} className={inputCls} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Reason (Optional)</label>
                  <input type="text" placeholder="e.g., Academic scholarship, Financial need" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inputCls} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" disabled={createScholarship.isPending || updateScholarship.isPending} className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg">
                    {(createScholarship.isPending || updateScholarship.isPending) ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingScholarship ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Discount Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bulk Discount for Class</h3>
                <button onClick={() => setShowBulkModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await bulkCreate.mutateAsync({
                  classId: formData.get('classId') as string,
                  termId: formData.get('termId') as string,
                  discountType: formData.get('discountType') as string,
                  discountValue: parseFloat(formData.get('discountValue') as string),
                  reason: formData.get('reason') as string,
                });
                setShowBulkModal(false);
                alert('Bulk discounts applied successfully!');
              }} className="space-y-4">
                <div>
                  <label className={labelCls}>Class *</label>
                  <select name="classId" className={inputCls} required>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Term *</label>
                  <select name="termId" className={inputCls} required>
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Discount Type</label>
                    <select name="discountType" className={inputCls}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₵)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Value</label>
                    <input name="discountValue" type="number" step="0.01" min="0" className={inputCls} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Reason</label>
                  <input name="reason" type="text" placeholder="e.g., Class-wide scholarship" className={inputCls} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" disabled={bulkCreate.isPending} className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg">
                    {bulkCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Apply to All Students'}
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
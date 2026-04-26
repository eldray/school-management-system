import { useState } from 'react';
import { Plus, Edit, Trash2, Loader2, X, Save, Copy, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useFeeTypes, useFeeTemplates, useCreateFeeTemplate, useUpdateFeeTemplate, useDeleteFeeTemplate } from '../../hooks/useFees';
import { useAuth } from '../../context/AuthContext';
import { FeeType } from '../../types/fee';

interface TemplateItem {
  feeTypeId: string;
  amount: string;
  isOptional: boolean;
}

export default function FeeTemplatesPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([
    { feeTypeId: '', amount: '', isOptional: false }
  ]);

  const { data: feeTypes = [] } = useFeeTypes();
  const { data: templates = [], isLoading } = useFeeTemplates();
  const createTemplate = useCreateFeeTemplate();
  const updateTemplate = useUpdateFeeTemplate();
  const deleteTemplate = useDeleteFeeTemplate();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const addItem = () => {
    setTemplateItems([...templateItems, { feeTypeId: '', amount: '', isOptional: false }]);
  };

  const removeItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: any) => {
    const updated = [...templateItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill amount when fee type is selected
    if (field === 'feeTypeId' && value) {
      const feeType = feeTypes.find(f => f.id === value);
      if (feeType) {
        updated[index].amount = feeType.amount.toString();
      }
    }
    
    setTemplateItems(updated);
  };

  const getAvailableFeeTypes = (currentIndex: number) => {
    const usedIds = templateItems
      .filter((_, i) => i !== currentIndex)
      .map(item => item.feeTypeId)
      .filter(Boolean);
    return feeTypes.filter(f => !usedIds.includes(f.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = templateItems.filter(item => item.feeTypeId && item.amount);
    if (validItems.length === 0) {
      alert('Please add at least one fee type to the template');
      return;
    }
    
    const payload = {
      name: form.name,
      description: form.description,
      items: validItems.map(item => ({
        feeTypeId: item.feeTypeId,
        amount: parseFloat(item.amount),
        isOptional: item.isOptional,
      })),
    };
    
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, data: payload });
      } else {
        await createTemplate.mutateAsync(payload);
      }
      setShowModal(false);
      setEditingTemplate(null);
      setForm({ name: '', description: '' });
      setTemplateItems([{ feeTypeId: '', amount: '', isOptional: false }]);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save template');
    }
  };

  const openEdit = (template: any) => {
    setEditingTemplate(template);
    setForm({ name: template.name, description: template.description || '' });
    setTemplateItems(
      template.items.map((item: any) => ({
        feeTypeId: item.feeTypeId,
        amount: item.amount.toString(),
        isOptional: item.isOptional,
      }))
    );
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Fee Templates">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fee Templates</h2>
            <p className="text-gray-500 text-sm mt-1">
              Create reusable fee templates to assign to classes
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingTemplate(null);
                setForm({ name: '', description: '' });
                setTemplateItems([{ feeTypeId: '', amount: '', isOptional: false }]);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Plus className="w-4 h-4" /> Create Template
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No fee templates created yet</p>
            <p className="text-sm text-gray-400 mt-1">Create a template to easily assign fees to classes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template: any) => {
              const totalAmount = template.items.reduce((sum: number, item: any) => sum + item.amount, 0);
              
              return (
                <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(template)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteTemplate.mutate(template.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total per student</span>
                      <span className="text-2xl font-bold text-[#1a3d30]">{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Included Fees</p>
                      {template.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {item.isOptional ? (
                              <span className="text-xs text-gray-400">(Optional)</span>
                            ) : (
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            )}
                            <span className="text-gray-600">{item.feeType?.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Copy className="w-3 h-3" />
                        <span>{template.items.length} fee type(s) included</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingTemplate ? 'Edit Fee Template' : 'Create Fee Template'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Group fee types into a reusable template
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelCls}>Template Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Standard Term Fees"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                    placeholder="Brief description of this fee template..."
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Fee Items</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm text-[#1a3d30] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Fee
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {templateItems.map((item, index) => {
                      const availableTypes = getAvailableFeeTypes(index);
                      const selectedFeeType = feeTypes.find(f => f.id === item.feeTypeId);
                      
                      return (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 relative">
                          {templateItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                              <select
                                value={item.feeTypeId}
                                onChange={(e) => updateItem(index, 'feeTypeId', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                                required
                              >
                                <option value="">Select Fee Type</option>
                                {availableTypes.map(type => (
                                  <option key={type.id} value={type.id}>
                                    {type.name} (Default: {formatCurrency(type.amount)})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-4">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Amount"
                                value={item.amount}
                                onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                required
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.isOptional}
                                  onChange={(e) => updateItem(index, 'isOptional', e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-[#1a3d30] focus:ring-[#1a3d30]"
                                />
                                <span className="text-xs text-gray-500">Optional</span>
                              </label>
                            </div>
                          </div>
                          
                          {selectedFeeType && selectedFeeType.description && (
                            <p className="text-xs text-gray-400 mt-2">{selectedFeeType.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {templateItems.some(i => i.feeTypeId && i.amount) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total per student:</span>
                      <span className="text-xl font-bold text-[#1a3d30]">
                        {formatCurrency(
                          templateItems
                            .filter(i => i.feeTypeId && i.amount)
                            .reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}

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
                    disabled={createTemplate.isPending || updateTemplate.isPending}
                    className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {(createTemplate.isPending || updateTemplate.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingTemplate ? 'Update Template' : 'Create Template'}
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
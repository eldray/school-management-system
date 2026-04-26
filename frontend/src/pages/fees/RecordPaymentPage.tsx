import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Search, CheckCircle, Circle, ChevronRight, Receipt, X, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useStudentFees } from '../../hooks/useFees';
import { useStudents } from '../../hooks/useStudents';
import { PaymentMethod } from '../../types/fee';
import api from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const paymentMethods: PaymentMethod[] = ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'];

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: '💵 Cash',
  MOBILE_MONEY: '📱 Mobile Money',
  BANK_TRANSFER: '🏦 Bank Transfer',
  CHEQUE: '📝 Cheque',
  ONLINE: '🌐 Online Payment',
};

export default function RecordPaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<any>(null);
  const [form, setForm] = useState({
    paymentMethod: 'CASH' as PaymentMethod,
    transactionRef: '',
    remarks: '',
  });

  const { data: students = [] } = useStudents();
  
  // Fetch ALL fees across all terms (no termId passed)
  const { data: studentFees = [], isLoading: loadingFees, refetch: refetchFees } = useStudentFees(
    selectedStudent?.id || ''
  );

  const bulkPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/fees/payments/bulk', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setCompletedPayment(data);
      setShowReceiptModal(true);
      setSelectedFees([]);
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      refetchFees();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group fees by term
  const feesByTerm = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    studentFees.forEach(fee => {
      const termName = fee.term?.name || 'Unknown Term';
      if (!grouped[termName]) {
        grouped[termName] = [];
      }
      grouped[termName].push(fee);
    });
    
    return grouped;
  }, [studentFees]);

  // Get all outstanding fees (balance > 0) across all terms
  const allOutstandingFees = studentFees.filter(f => f.balance > 0);
  const allFullyPaidFees = studentFees.filter(f => f.balance === 0);

  const totalOutstanding = allOutstandingFees.reduce((sum, f) => sum + f.balance, 0);
  const totalFees = studentFees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = totalFees - totalOutstanding;

  const selectedFeesData = studentFees.filter(f => selectedFees.includes(f.id));
  const totalSelected = selectedFeesData.reduce((sum, f) => sum + f.balance, 0);

  const isFullyPaid = allOutstandingFees.length === 0 && studentFees.length > 0;

  const handleSelectAllOutstanding = () => {
    const outstandingIds = allOutstandingFees.map(f => f.id);
    setSelectedFees(outstandingIds);
  };

  const handleClearSelection = () => {
    setSelectedFees([]);
  };

  const handleToggleFee = (feeId: string) => {
    setSelectedFees(prev => 
      prev.includes(feeId) 
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFees.length === 0) {
      alert('Please select at least one fee to pay');
      return;
    }

    if (totalSelected <= 0) {
      alert('No outstanding balance for selected fees');
      return;
    }

    bulkPaymentMutation.mutate({
      studentId: selectedStudent.id,
      feeStructureIds: selectedFees,
      paymentMethod: form.paymentMethod,
      transactionRef: form.transactionRef || undefined,
      remarks: form.remarks || undefined,
    });
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  useEffect(() => {
    setSelectedFees([]);
  }, [selectedStudent]);

  return (
    <DashboardLayout title="Record Payment">
      <button 
        onClick={() => navigate('/fees')} 
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Fees
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Select Student</h3>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30]"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No students found</p>
              </div>
            ) : (
              filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'bg-[#1a3d30] text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                      <p className={`text-sm ${selectedStudent?.id === student.id ? 'text-white/70' : 'text-gray-500'}`}>
                        {student.admissionNumber} • {student.class?.name || 'No Class'}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${selectedStudent?.id === student.id ? 'text-white/70' : 'text-gray-400'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Fee Display */}
        <div>
          {selectedStudent ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <button
                  onClick={() => refetchFees()}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loadingFees ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1a3d30]" />
                </div>
              ) : studentFees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No fees assigned</p>
                </div>
              ) : isFullyPaid ? (
                // FULLY PAID - Show summary only, no payment form
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">All Fees Paid!</p>
                        <p className="text-sm text-green-700">This student has no outstanding balance across all terms.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total Fees (All Terms)</p>
                      <p className="text-xl font-bold text-gray-900">₵{totalFees.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">₵{totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className="text-xl font-bold text-green-600">₵0</p>
                    </div>
                  </div>

                  {/* Show paid fees grouped by term */}
                  {Object.entries(feesByTerm).map(([termName, fees]) => (
                    <div key={termName} className="border-t border-gray-100 pt-4">
                      <h4 className="font-medium text-gray-700 mb-2">{termName}</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {fees.map(fee => (
                          <div key={fee.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">{fee.feeType.name}</span>
                              <span className="text-sm text-gray-600">₵{fee.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">{fee.feeType.category}</span>
                              <span className="text-sm font-medium text-green-600">
                                Paid: ₵{(fee.totalPaid || fee.amount).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // HAS OUTSTANDING FEES - Show payment form grouped by term
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total Fees (All Terms)</p>
                      <p className="text-lg font-bold text-gray-900">₵{totalFees.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total Paid</p>
                      <p className="text-lg font-bold text-green-600">₵{totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Total Outstanding</p>
                      <p className="text-lg font-bold text-red-600">₵{totalOutstanding.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">
                      Outstanding Fees ({allOutstandingFees.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllOutstanding}
                        className="text-xs text-[#1a3d30] hover:underline font-medium"
                      >
                        Select All Outstanding
                      </button>
                      {selectedFees.length > 0 && (
                        <button
                          onClick={handleClearSelection}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Clear ({selectedFees.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Group outstanding fees by term */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(feesByTerm).map(([termName, fees]) => {
                      const termOutstandingFees = fees.filter(f => f.balance > 0);
                      if (termOutstandingFees.length === 0) return null;
                      
                      const termOutstandingTotal = termOutstandingFees.reduce((sum, f) => sum + f.balance, 0);
                      
                      return (
                        <div key={termName} className="border border-gray-100 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-gray-700">{termName}</h4>
                              <span className="text-xs font-medium text-red-600">
                                Due: ₵{termOutstandingTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 space-y-2">
                            {termOutstandingFees.map(fee => {
                              const isSelected = selectedFees.includes(fee.id);
                              const balance = fee.balance;
                              
                              return (
                                <div
                                  key={fee.id}
                                  onClick={() => handleToggleFee(fee.id)}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-[#1a3d30] bg-[#1a3d30]/5 shadow-sm'
                                      : 'border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                      {isSelected ? (
                                        <CheckCircle className="w-4 h-4 text-[#1a3d30]" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-gray-300" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900">{fee.feeType.name}</span>
                                        <span className="text-sm text-gray-700">₵{fee.amount.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-500">{fee.feeType.category}</span>
                                        <span className="text-sm font-medium text-red-600">
                                          Balance: ₵{balance.toLocaleString()}
                                        </span>
                                      </div>
                                      {fee.totalPaid > 0 && (
                                        <div className="text-xs text-green-600 mt-1">
                                          Already paid: ₵{fee.totalPaid.toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Summary */}
                  {selectedFees.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-[#1a3d30]/5 to-[#2a5d50]/5 rounded-xl border border-[#1a3d30]/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total to Pay:</span>
                        <span className="text-xl font-bold text-[#1a3d30]">₵{totalSelected.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Paying {selectedFees.length} fee(s) across {new Set(selectedFeesData.map(f => f.term?.name)).size} term(s)
                      </p>
                    </div>
                  )}

                  {/* Payment Form */}
                  {selectedFees.length > 0 && (
                    <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4 mt-4">
                      <div>
                        <label className={labelCls}>Payment Method *</label>
                        <select
                          value={form.paymentMethod}
                          onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                          className={inputCls}
                          required
                        >
                          {paymentMethods.map(method => (
                            <option key={method} value={method}>{paymentMethodLabels[method]}</option>
                          ))}
                        </select>
                      </div>

                      {(form.paymentMethod === 'MOBILE_MONEY' || form.paymentMethod === 'BANK_TRANSFER') && (
                        <div>
                          <label className={labelCls}>Transaction Reference</label>
                          <input
                            type="text"
                            placeholder={form.paymentMethod === 'MOBILE_MONEY' ? 'e.g., MOM123456' : 'e.g., TRF789012'}
                            value={form.transactionRef}
                            onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                      )}

                      <div>
                        <label className={labelCls}>Remarks (Optional)</label>
                        <textarea
                          value={form.remarks}
                          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                          className={`${inputCls} resize-none h-16`}
                          placeholder="Add any notes..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={bulkPaymentMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 bg-[#1a3d30] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50 transition-colors"
                      >
                        {bulkPaymentMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Pay ₵{totalSelected.toLocaleString()}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a student to view their fees</p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && completedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Payment Successful!</h3>
                  <p className="text-sm text-gray-500">Receipt #{completedPayment.receiptNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="font-medium text-gray-900">{completedPayment.student?.name}</p>
                <p className="text-sm text-gray-500">{completedPayment.student?.admissionNumber} • {completedPayment.student?.class}</p>
                <p className="text-sm text-gray-500 mt-1">{completedPayment.term}</p>
              </div>

              <h4 className="font-medium text-gray-700 mb-2">Payment Breakdown</h4>
              <div className="space-y-2 mb-4">
                {completedPayment.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">{item.feeType}</span>
                    <span className="font-medium text-gray-900">₵{item.amountPaid.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total Paid</span>
                <span className="text-xl font-bold text-[#1a3d30]">₵{completedPayment.totalAmount.toLocaleString()}</span>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-medium">{paymentMethodLabels[completedPayment.paymentMethod]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{new Date(completedPayment.paymentDate).toLocaleString()}</span>
                </div>
                {completedPayment.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reference:</span>
                    <span className="font-medium">{completedPayment.transactionRef}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedStudent(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#1a3d30] text-white rounded-xl text-sm font-medium hover:bg-[#153328]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
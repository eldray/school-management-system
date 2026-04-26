import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, DollarSign, TrendingUp, Users, Calendar, Loader2, CreditCard, Banknote, Smartphone, Receipt, Eye, Layers } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { usePayments, useStudentFees } from '../../hooks/useFees';
import { useTerms } from '../../hooks/useExams';
import { useClasses } from '../../hooks/useClasses';

const paymentMethodIcons: Record<string, any> = {
  CASH: Banknote,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: CreditCard,
  CHEQUE: CreditCard,
  ONLINE: CreditCard,
};

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
  BULK: 'bg-gray-100 text-gray-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function FeesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [termFilter, setTermFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  const { data: terms = [] } = useTerms();
  const { data: classes = [] } = useClasses();
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAccountant = user?.role === 'ACCOUNTANT';
  const isTeacher = user?.role === 'TEACHER';
  const isParent = user?.role === 'PARENT';
  const isStudent = user?.role === 'STUDENT';
  
  const canManage = isAdmin || isAccountant;

  // For students and parents, get their specific fees
  const { data: studentPayments = [], isLoading: studentPaymentsLoading } = useStudentFees(
    isStudent ? user?.studentId : (isParent && user?.studentId ? user.studentId : ''),
    termFilter !== 'ALL' ? termFilter : undefined
  );

  // For admin/accountant, get all payments
  const { data: allPayments = [], isLoading: allPaymentsLoading } = usePayments({
    termId: termFilter !== 'ALL' ? termFilter : undefined,
    classId: (isAdmin || isAccountant) && classFilter !== 'ALL' ? classFilter : undefined,
  });

  // Determine which payments to show
  let payments: any[] = [];
  let isLoading = false;

  if (isStudent || isParent) {
    payments = studentPayments;
    isLoading = studentPaymentsLoading;
  } else {
    payments = allPayments;
    isLoading = allPaymentsLoading;
  }

  const activeTerm = terms.find(t => t.isActive);

  // Filter payments by search term (only for admin/accountant, students/parents see their own)
  let filteredPayments = payments;
  
  if (isAdmin || isAccountant) {
    filteredPayments = payments.filter(p =>
      p.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const totalCollected = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter(p => {
    const paymentDate = new Date(p.paymentDate).toISOString().split('T')[0];
    return paymentDate === today;
  });
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  return (
    <DashboardLayout title="Fees Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fees Management</h2>
            <p className="text-gray-500 text-sm mt-1">
              {isStudent || isParent 
                ? 'View your fee payment history and receipts'
                : 'Manage fee structures, record payments, and track collections'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => navigate('/fees/templates')}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <Layers className="w-4 h-4" />
                  Fee Templates
                </button>
                <button
                  onClick={() => navigate('/fees/types')}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <DollarSign className="w-4 h-4" />
                  Fee Types
                </button>
                <button
                  onClick={() => navigate('/fees/assign')}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <Users className="w-4 h-4" />
                  Assign Fees
                </button>
                <button
                  onClick={() => navigate('/fees/record')}
                  className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
                >
                  <Plus className="w-4 h-4" />
                  Record Payment
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards - Hide for students/parents or show simplified */}
        {(isAdmin || isAccountant) && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Collected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₵{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Today's Collections</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₵{todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Term</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activeTerm?.name || 'No active term'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student/Parent Summary Card */}
        {(isStudent || isParent) && (
          <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Fees Paid</p>
                <p className="text-3xl font-bold">
                  ₵{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Receipt className="w-8 h-8" />
              </div>
            </div>
          </div>
        )}

        {/* Filters - Hide class filter for students/parents */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={isStudent || isParent 
                ? "Search by receipt number..."
                : "Search by student name, admission no, or receipt..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="ALL">All Terms</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
          {/* Only show class filter for admin/accountant */}
          {(isAdmin || isAccountant) && (
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {isStudent || isParent ? 'Your Payment History' : 'Recent Payments'}
            </h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payments found</p>
              {(isStudent || isParent) && (
                <p className="text-sm text-gray-400 mt-1">
                  No fee payments have been recorded for this student yet.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Receipt No.</th>
                    {(isAdmin || isAccountant) && (
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                    )}
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.slice(0, 20).map((payment) => {
                    const MethodIcon = paymentMethodIcons[payment.paymentMethod] || CreditCard;
                    const isBulk = payment.isBulk === true;
                    const feeTypeName = isBulk
                      ? `💳 Bulk Payment (${payment.itemsCount} items)`
                      : payment.feeStructure?.feeType?.name || 'Fee';
                    const feeCategory = isBulk ? 'BULK' : payment.feeStructure?.feeType?.category || 'OTHER';
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">{payment.receiptNumber}</span>
                        </td>
                        {(isAdmin || isAccountant) && (
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">
                              {payment.student?.firstName} {payment.student?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{payment.student?.admissionNumber}</p>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[feeCategory] || categoryColors.OTHER}`}>
                            {feeTypeName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            ₵{payment.amountPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <MethodIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 capitalize">
                              {payment.paymentMethod?.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => navigate(`/fees/receipts/${payment.receiptNumber}`)}
                            className="flex items-center gap-1 text-sm text-[#1a3d30] hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
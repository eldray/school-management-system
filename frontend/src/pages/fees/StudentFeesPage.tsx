import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, CreditCard, Calendar, Loader2, 
  AlertCircle, CheckCircle, Clock, Receipt, 
  Eye, Download, TrendingUp, TrendingDown, X,
  Banknote, Smartphone, ChevronRight
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useActiveTerm } from '../../hooks/useExams';
import { useStudentFeeStructures, useStudentPayments } from '../../hooks/useFees';

const paymentMethodIcons: Record<string, any> = {
  CASH: Banknote,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: CreditCard,
  CHEQUE: CreditCard,
  ONLINE: CreditCard,
};

export default function StudentFeesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [showReceiptModal, setShowReceiptModal] = useState<any>(null);
  
  const { data: activeTerm } = useActiveTerm();
  const studentId = user?.studentId || (user?.role === 'PARENT' && user?.studentIds?.[0]);
  
  // Fetch fee structures (what the student owes)
  const { data: feeStructures = [], isLoading: structuresLoading } = useStudentFeeStructures(
    studentId || '',
    selectedTerm || activeTerm?.id
  );
  
  // Fetch payments made
  const { data: payments = [], isLoading: paymentsLoading } = useStudentPayments(
    studentId || '',
    selectedTerm || activeTerm?.id
  );

  const isLoading = structuresLoading || paymentsLoading;
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

  // Calculate totals
  const totalOwed = feeStructures.reduce((sum, fs) => sum + (fs.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalBalance = totalOwed - totalPaid;
  const paymentPercentage = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return `₵${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (balance: number) => {
    if (balance <= 0) return 'text-green-600 bg-green-50';
    if (balance > 0 && balance < totalOwed) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusText = (balance: number) => {
    if (balance <= 0) return 'Fully Paid';
    if (balance > 0 && balance < totalOwed) return 'Partial Payment';
    return 'Unpaid';
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Fees & Bills">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Fees & Bills">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isParent ? 'Child\'s Fee Details' : 'My Fee Details'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            View your fee structure, payment history, and outstanding balance
          </p>
        </div>

        {/* Term Selector */}
        <div className="flex items-center justify-between">
          <select
            value={selectedTerm || activeTerm?.id || ''}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">Select Term</option>
            {/* You'll need to fetch all terms for this dropdown */}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total Owed */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">Total Fees</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalOwed)}</p>
            <p className="text-xs text-gray-400 mt-1">For current term</p>
          </div>

          {/* Total Paid */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Total Paid</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-400 mt-1">{payments.length} payment(s)</p>
          </div>

          {/* Balance */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(totalBalance)}`}>
                <Clock className={`w-5 h-5 ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
            </div>
            <p className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {totalBalance > 0 ? 'Payment required' : 'Fully paid'}
            </p>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500">Payment Status</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{getStatusText(totalBalance)}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{paymentPercentage.toFixed(1)}% paid</p>
          </div>
        </div>

        {/* Fee Breakdown Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Fee Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">Detailed view of all fee types and payments</p>
          </div>

          {feeStructures.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No fee structure assigned for this term</p>
              <p className="text-sm text-gray-400 mt-1">Check back later or contact the finance office</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feeStructures.map((fee: any) => {
                    const feePayments = payments.filter(p => p.feeStructureId === fee.id);
                    const paidAmount = feePayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
                    const balance = (fee.amount || 0) - paidAmount;
                    const isFullyPaid = balance <= 0;
                    const isPartiallyPaid = paidAmount > 0 && balance > 0;
                    
                    return (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800">{fee.feeType?.name}</p>
                          {fee.dueDate && (
                            <p className="text-xs text-gray-400">Due: {formatDate(fee.dueDate)}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            fee.feeType?.category === 'TUITION' ? 'bg-blue-100 text-blue-700' :
                            fee.feeType?.category === 'EXAM' ? 'bg-red-100 text-red-700' :
                            fee.feeType?.category === 'PTA' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {fee.feeType?.category || 'OTHER'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(fee.amount)}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatCurrency(paidAmount)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(balance)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              <CheckCircle className="w-3 h-3" /> Paid
                            </span>
                          ) : isPartiallyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                              <Clock className="w-3 h-3" /> Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                              <AlertCircle className="w-3 h-3" /> Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {feePayments.length > 0 && (
                            <button
                              onClick={() => setShowReceiptModal(feePayments[0])}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 font-semibold text-gray-800">Total</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totalOwed)}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(totalPaid)}</td>
                    <td className={`py-3 px-4 text-right font-bold ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(totalBalance)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Payment History</h3>
              <p className="text-xs text-gray-500 mt-0.5">Record of all payments made</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Receipt No.</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment: any) => {
                    const MethodIcon = paymentMethodIcons[payment.paymentMethod] || CreditCard;
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">{payment.receiptNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-800">
                            {payment.feeStructure?.feeType?.name || 'Fee Payment'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">
                          {formatCurrency(payment.amountPaid)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <MethodIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 capitalize">
                              {payment.paymentMethod?.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setShowReceiptModal(payment)}
                            className="flex items-center gap-1 text-sm text-[#1a3d30] hover:underline mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Need to make a payment?</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Please visit the school's finance office to make payments. 
                Official receipts will be issued for all payments made.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Payment Receipt</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Official payment confirmation</p>
                </div>
                <button
                  onClick={() => setShowReceiptModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center pb-4 border-b border-gray-100">
                <div className="w-16 h-16 bg-[#1a3d30] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <p className="font-mono text-lg font-bold text-gray-800">{showReceiptModal.receiptNumber}</p>
                <p className="text-xs text-gray-400">Receipt Number</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm font-medium text-gray-800">{formatDate(showReceiptModal.paymentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Student Name</span>
                  <span className="text-sm font-medium text-gray-800">
                    {showReceiptModal.student?.firstName} {showReceiptModal.student?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Admission No.</span>
                  <span className="text-sm font-medium text-gray-800">{showReceiptModal.student?.admissionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Fee Type</span>
                  <span className="text-sm font-medium text-gray-800">
                    {showReceiptModal.feeStructure?.feeType?.name || 'Fee Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Amount Paid</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(showReceiptModal.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <span className="text-sm font-medium text-gray-800 capitalize">
                    {showReceiptModal.paymentMethod?.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>
                {showReceiptModal.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Transaction Ref</span>
                    <span className="text-sm font-mono text-gray-600">{showReceiptModal.transactionRef}</span>
                  </div>
                )}
              </div>

              <div className="bg-green-50 rounded-xl p-3 text-center mt-4">
                <p className="text-xs text-green-700">✅ Payment confirmed. Thank you!</p>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowReceiptModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#1a3d30] text-white rounded-xl text-sm font-medium hover:bg-[#153328] transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Loader2, Receipt, Calendar, User, CreditCard, Hash, FileText } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const paymentMethodLabels: Record<string, string> = {
  CASH: '💵 Cash',
  MOBILE_MONEY: '📱 Mobile Money',
  BANK_TRANSFER: '🏦 Bank Transfer',
  CHEQUE: '📝 Cheque',
  ONLINE: '🌐 Online Payment',
};

export default function ReceiptDetailPage() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: receipt, isLoading, error } = useQuery({
    queryKey: ['receipt', receiptNumber],
    queryFn: async () => {
      const res = await api.get(`/fees/receipts/${receiptNumber}`);
      return res.data.data;
    },
    enabled: !!receiptNumber,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${receiptNumber}`,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Receipt Details">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Receipt Details">
        <div className="text-center py-12">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block">
            <p>Error loading receipt: {(error as any)?.message || 'Unknown error'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!receipt) {
    return (
      <DashboardLayout title="Receipt Details">
        <div className="text-center py-12">
          <p className="text-gray-500">Receipt not found</p>
        </div>
      </DashboardLayout>
    );
  }

  // Helper function to get payment items safely
  const getPaymentItems = () => {
    // If receipt has items array, use it
    if (receipt.items && Array.isArray(receipt.items) && receipt.items.length > 0) {
      return receipt.items;
    }
    
    // If receipt has payments array (alternative structure)
    if (receipt.payments && Array.isArray(receipt.payments) && receipt.payments.length > 0) {
      return receipt.payments.map((payment: any) => ({
        feeType: payment.feeType || payment.feeStructure?.feeType?.name || 'Fee Payment',
        amount: payment.amount || 0,
        amountPaid: payment.amountPaid || payment.amount || 0,
      }));
    }
    
    // If receipt has single payment info (not bulk)
    if (receipt.feeType) {
      return [{
        feeType: receipt.feeType,
        amount: receipt.amount || 0,
        amountPaid: receipt.amountPaid || receipt.amount || 0,
      }];
    }
    
    // Fallback: return empty array
    return [];
  };

  // Helper function to get student info safely
  const getStudentInfo = () => {
    if (receipt.student) {
      return {
        name: receipt.student.name || `${receipt.student.firstName || ''} ${receipt.student.lastName || ''}`.trim() || 'N/A',
        admissionNumber: receipt.student.admissionNumber || 'N/A',
        class: receipt.student.class || receipt.student.className || 'N/A',
      };
    }
    
    if (receipt.studentName) {
      return {
        name: receipt.studentName,
        admissionNumber: receipt.admissionNumber || 'N/A',
        class: receipt.className || 'N/A',
      };
    }
    
    return {
      name: 'N/A',
      admissionNumber: 'N/A',
      class: 'N/A',
    };
  };

  // Helper function to get total amount safely
  const getTotalAmount = () => {
    if (receipt.totalAmount) return receipt.totalAmount;
    if (receipt.amount) return receipt.amount;
    if (receipt.amountPaid) return receipt.amountPaid;
    
    const items = getPaymentItems();
    if (items.length > 0) {
      return items.reduce((sum, item) => sum + (item.amountPaid || item.amount || 0), 0);
    }
    
    return 0;
  };

  // Helper function to get term safely
  const getTerm = () => {
    return receipt.term || receipt.termName || 'Current Term';
  };

  const paymentItems = getPaymentItems();
  const studentInfo = getStudentInfo();
  const totalAmount = getTotalAmount();
  const term = getTerm();

  return (
    <DashboardLayout title="Receipt Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <button onClick={() => navigate('/fees')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to Fees
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        <div ref={printRef} className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Receipt Header */}
          <div className="text-center border-b-2 border-[#1a3d30] pb-4 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Receipt className="w-8 h-8 text-[#1a3d30]" />
              <h1 className="text-2xl font-bold text-[#1a3d30]">PAYMENT RECEIPT</h1>
            </div>
            <p className="text-sm text-gray-500">Official Receipt</p>
          </div>

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Receipt Number</p>
                <p className="font-mono font-medium">{receipt.receiptNumber || receiptNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Payment Date</p>
                <p className="font-medium">
                  {receipt.paymentDate 
                    ? new Date(receipt.paymentDate).toLocaleString()
                    : new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-700">Student Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium">{studentInfo.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Admission Number</p>
                <p className="font-mono">{studentInfo.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Class</p>
                <p>{studentInfo.class}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Term</p>
                <p>{term}</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <h3 className="font-medium text-gray-700 mb-3">Payment Details</h3>
          
          {paymentItems.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl mb-6">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No payment items found</p>
            </div>
          ) : (
            <table className="w-full mb-6">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Fee Type</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Amount</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentItems.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 px-3">{item.feeType}</td>
                    <td className="py-2 px-3 text-right">₵{(item.amount || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-medium text-green-600">₵{(item.amountPaid || item.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200">
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-right font-semibold">Total Paid:</td>
                  <td className="py-3 px-3 text-right text-xl font-bold text-[#1a3d30]">₵{totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Payment Method */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-700">Payment Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Method</p>
                <p className="font-medium">{paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod || 'CASH'}</p>
              </div>
              {receipt.transactionRef && (
                <div>
                  <p className="text-xs text-gray-500">Transaction Reference</p>
                  <p className="font-mono">{receipt.transactionRef}</p>
                </div>
              )}
              {receipt.remarks && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Remarks</p>
                  <p>{receipt.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p className="mt-1">Thank you for your payment!</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
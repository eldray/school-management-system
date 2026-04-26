export interface FeeType {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category: FeeCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeeCategory = 
  | 'TUITION'
  | 'PTA'
  | 'CANTEEN'
  | 'SPORTS'
  | 'EXAM'
  | 'LIBRARY'
  | 'ICT'
  | 'UNIFORM'
  | 'TRANSPORT'
  | 'OTHER';

export type PaymentMethod = 
  | 'CASH'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'ONLINE';

export interface FeeStructure {
  id: string;
  feeTypeId: string;
  classId?: string;
  studentId?: string;
  amount: number;
  termId: string;
  dueDate?: string;
  feeType: FeeType;
  class?: { id: string; name: string };
  student?: { id: string; firstName: string; lastName: string; admissionNumber: string };
  term: AcademicTerm;
  totalPaid?: number;
  balance?: number;
  payments?: Payment[];
  source?: 'class' | 'student';
}

export interface Payment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  amountPaid: number;
  balance?: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  transactionRef?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  recordedBy?: string;
  remarks?: string;
  student: { id: string; firstName: string; lastName: string; admissionNumber: string; class?: { name: string } };
  feeStructure: { feeType: FeeType; term: AcademicTerm };
  createdAt: string;
}

export interface StudentFeeSummary {
  id: string;
  studentId: string;
  totalFees: number;
  totalPaid: number;
  balance: number;
  termId: string;
  student: { id: string; firstName: string; lastName: string; admissionNumber: string; class?: { name: string } };
  term: AcademicTerm;
}

export interface CreateFeeTypeInput {
  name: string;
  description?: string;
  amount: number;
  category: FeeCategory;
}

export interface BulkFeeAssignmentInput {
  classId?: string;
  studentId?: string;
  termId: string;
  fees: {
    feeTypeId: string;
    amount: number;
    dueDate?: string;
  }[];
}

export interface RecordPaymentInput {
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  remarks?: string;
}

// Import AcademicTerm from exam types
import { AcademicTerm } from './exam';
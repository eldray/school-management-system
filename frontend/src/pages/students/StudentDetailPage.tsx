import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Pencil, Trash2, User, GraduationCap, Shield, Phone, Mail, MapPin, Calendar, 
  Check, X, BookOpen, DollarSign, Award, Clock, Loader2, TrendingUp, TrendingDown,
  FileText, AlertCircle, CreditCard, CheckCircle, XCircle
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import { Student, Class } from '../../types';
import { useStudentFees } from '../../hooks/useFees';
import { useStudentResults } from '../../hooks/useExams';
import { useActiveTerm } from '../../hooks/useExams';
import { useActivateStudent } from '../../hooks/useStudents';

type TabType = 'overview' | 'academics' | 'fees' | 'attendance';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isChangingClass, setIsChangingClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Modal state
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await api.get(`/students/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    onSuccess: (data) => {
      setSelectedClassId(data.class?.id || '');
    },
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.data.data;
    },
  });

  const { data: activeTerm } = useActiveTerm();
  const { data: fees = [], isLoading: feesLoading } = useStudentFees(id || '', activeTerm?.id || '');
  const { data: results = [], isLoading: resultsLoading } = useStudentResults(id || '');

  // Fetch attendance stats for quick stats row
  const { data: attendanceStats } = useQuery({
    queryKey: ['student-attendance-stats', id],
    queryFn: async () => {
      const res = await api.get(`/attendance/student/${id}/stats`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const updateClassMutation = useMutation({
    mutationFn: (classId: string) => api.put(`/students/${id}`, { classId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsChangingClass(false);
    },
  });
  
  const activateStudentMutation = useActivateStudent();

  const handleActivate = () => {
    activateStudentMutation.mutate(id!, {
      onSuccess: () => {
        setShowActivateModal(false);
      },
    });
  };

  const deleteStudentMutation = useMutation({
    mutationFn: (studentId: string) => api.delete(`/students/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/students');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to deactivate student');
    },
  });

  const handleDeactivate = () => {
    deleteStudentMutation.mutate(id!, {
      onSuccess: () => {
        setShowDeactivateModal(false);
      },
    });
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalFees = fees?.reduce((sum, f) => sum + f.amount, 0) || 0;
  const totalPaid = fees?.reduce((sum, f) => sum + (f.totalPaid || 0), 0) || 0;
  const totalBalance = totalFees - totalPaid;

  const averageScore = results.length > 0
    ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
    : 0;

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
    GRADUATED: 'bg-blue-50 text-blue-700 border-blue-200',
    SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  };

  const initials = `${student?.firstName?.[0] || ''}${student?.lastName?.[0] || ''}`.toUpperCase();

  if (isLoading) {
    return (
      <DashboardLayout title="Student Details">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Details">
        <div className="text-center py-12">
          <p className="text-gray-400">Student not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User },
    { id: 'academics' as TabType, label: 'Academics', icon: Award },
    { id: 'fees' as TabType, label: 'Fees', icon: DollarSign },
    { id: 'attendance' as TabType, label: 'Attendance', icon: Clock },
  ];

  return (
    <DashboardLayout title="Student Details">
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      {/* Header Card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1a3d30] to-[#2a5d50] rounded-full flex items-center justify-center text-xl font-bold text-white">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {student.firstName} {student.lastName}
                </h1>
                <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${statusColors[student.status]}`}>
                  {student.status.toLowerCase()}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5 font-mono">{student.admissionNumber}</p>
              <p className="text-sm text-gray-500 mt-1">{student.class?.name || 'No Class Assigned'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(`/students/${id}/edit`)}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            
            {student.status === 'INACTIVE' ? (
              <button 
                onClick={() => setShowActivateModal(true)}
                className="flex items-center gap-2 bg-green-50 text-green-600 border border-green-200 px-4 py-2 rounded-xl text-sm hover:bg-green-100 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Activate
              </button>
            ) : (
              <button 
                onClick={() => setShowDeactivateModal(true)}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Deactivate
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          <div className="p-4">
            <p className="text-xs text-gray-500">Class</p>
            <p className="font-medium text-gray-900">{student.class?.name || 'Unassigned'}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500">Average Score</p>
            <p className={`font-medium ${averageScore >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {averageScore.toFixed(1)}%
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500">Fees Balance</p>
            <p className={`font-medium ${totalBalance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500">Attendance</p>
            {attendanceStats ? (
              <p className={`font-medium ${attendanceStats.attendanceRate >= 75 ? 'text-green-600' : attendanceStats.attendanceRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {attendanceStats.attendanceRate.toFixed(1)}%
              </p>
            ) : (
              <p className="font-medium text-gray-400">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1a3d30] text-[#1a3d30]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* ============================================ */}
        {/* OVERVIEW TAB */}
        {/* ============================================ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Personal Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-gray-700 text-sm">Personal Information</h3>
              </div>
              <div className="space-y-4">
                <InfoRow label="Gender" value={student.gender?.toLowerCase()} />
                <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} icon={Calendar} />
                <InfoRow label="Address" value={student.address || 'No address provided'} icon={MapPin} />
                <InfoRow label="Admission Date" value={formatDate(student.createdAt)} />
              </div>
            </div>

            {/* Academic Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-gray-700 text-sm">Academic Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Current Class</p>
                  {isChangingClass ? (
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 flex-1"
                        autoFocus
                      >
                        <option value="">No Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateClassMutation.mutate(selectedClassId)}
                        disabled={updateClassMutation.isPending}
                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingClass(false);
                          setSelectedClassId(student.class?.id || '');
                        }}
                        className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {student.class?.name || 'Not Assigned'}
                      </span>
                      <button onClick={() => setIsChangingClass(true)} className="text-xs text-[#1a3d30] hover:underline">
                        Change
                      </button>
                    </div>
                  )}
                </div>
                <InfoRow label="Admission Number" value={student.admissionNumber} />
                <InfoRow label="Enrollment Date" value={formatDate(student.createdAt)} />
              </div>
            </div>

            {/* Guardian Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-gray-700 text-sm">Guardian Information</h3>
              </div>
              <div className="space-y-4">
                <InfoRow label="Name" value={student.guardian?.name || '—'} />
                <InfoRow label="Phone" value={student.guardian?.phone || '—'} icon={Phone} />
                <InfoRow label="Email" value={student.guardian?.email || 'Not provided'} icon={Mail} />
                <InfoRow label="Address" value={student.guardian?.address || 'Same as student'} />
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ACADEMICS TAB */}
        {/* ============================================ */}
        {activeTab === 'academics' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Exams Taken" value={results.length} icon={FileText} color="blue" />
              <StatCard label="Average Score" value={`${averageScore.toFixed(1)}%`} icon={Award} color="amber" />
              <StatCard label="Highest Score" value={results.length > 0 ? `${Math.max(...results.map(r => r.percentage || 0)).toFixed(1)}%` : '—'} icon={TrendingUp} color="green" />
              <StatCard label="Lowest Score" value={results.length > 0 ? `${Math.min(...results.map(r => r.percentage || 0)).toFixed(1)}%` : '—'} icon={TrendingDown} color="red" />
            </div>

            {/* Results Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Exam Results</h3>
              </div>
              {resultsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1a3d30]" /></div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No exam results yet</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Term</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Marks</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{result.exam?.subject?.name}</td>
                        <td className="py-3 px-4 text-sm">{result.exam?.type?.replace('_', ' ')}</td>
                        <td className="py-3 px-4 text-sm">{result.exam?.term?.name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-medium">{result.marksObtained?.toFixed(1) || '—'}</span>
                          <span className="text-gray-400 text-xs">/{result.exam?.totalMarks}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <GradeBadge grade={result.grade} percentage={result.percentage} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* FEES TAB */}
        {/* ============================================ */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Fees" value={formatCurrency(totalFees)} icon={DollarSign} color="blue" />
              <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon={CreditCard} color="green" />
              <StatCard label="Balance" value={formatCurrency(totalBalance)} icon={AlertCircle} color={totalBalance > 0 ? 'red' : 'green'} />
            </div>

            {/* Fees Breakdown */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Fee Breakdown ({activeTerm?.name || 'Current Term'})</h3>
              </div>
              {feesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1a3d30]" /></div>
              ) : fees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No fees assigned for this term</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{fee.feeType.name}</td>
                        <td className="py-3 px-4 text-center">{formatCurrency(fee.amount)}</td>
                        <td className="py-3 px-4 text-center text-green-600">{formatCurrency(fee.totalPaid || 0)}</td>
                        <td className={`py-3 px-4 text-center font-medium ${fee.balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(fee.balance || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {fee.balance === 0 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Paid</span>
                          ) : fee.totalPaid && fee.totalPaid > 0 ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Partial</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Unpaid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ATTENDANCE TAB */}
        {/* ============================================ */}
        {activeTab === 'attendance' && (
          <AttendanceTab studentId={id!} />
        )}
      </div>

      {/* Activate Confirmation Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Activate Student</h3>
                <p className="text-sm text-gray-500">Restore student access</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to activate <span className="font-semibold text-gray-900">{student.firstName} {student.lastName}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              They will be able to access the system and appear in active student lists.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowActivateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={activateStudentMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {activateStudentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Yes, Activate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Deactivate Student</h3>
                <p className="text-sm text-gray-500">This action can be reversed</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to deactivate <span className="font-semibold text-gray-900">{student.firstName} {student.lastName}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The student will no longer be able to access the system and will be hidden from active lists. You can reactivate them later if needed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deleteStudentMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleteStudentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Deactivate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ============================================
// ATTENDANCE TAB COMPONENT
// ============================================
function AttendanceTab({ studentId }: { studentId: string }) {
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance', studentId],
    queryFn: async () => {
      const res = await api.get(`/attendance/student/${studentId}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });

  const { data: stats } = useQuery({
    queryKey: ['student-attendance-stats', studentId],
    queryFn: async () => {
      const res = await api.get(`/attendance/student/${studentId}/stats`);
      return res.data.data;
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
      </div>
    );
  }

  const attendanceRecords = attendanceData || [];
  const attendanceStats = stats || { total: 0, present: 0, absent: 0, late: 0, attendanceRate: 0 };

  // Group attendance by month
  const groupedByMonth = attendanceRecords.reduce((acc: Record<string, any[]>, record: any) => {
    const date = new Date(record.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(record);
    return acc;
  }, {});

  const formatDateFull = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-700 border-green-200';
      case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'LATE': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ABSENT': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'LATE': return <Clock className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard 
          label="Attendance Rate" 
          value={`${attendanceStats.attendanceRate.toFixed(1)}%`} 
          icon={Clock} 
          color={attendanceStats.attendanceRate >= 75 ? 'green' : attendanceStats.attendanceRate >= 50 ? 'amber' : 'red'} 
        />
        <StatCard 
          label="Total Days" 
          value={attendanceStats.total} 
          icon={Calendar} 
          color="blue" 
        />
        <StatCard 
          label="Present" 
          value={attendanceStats.present} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatCard 
          label="Absent" 
          value={attendanceStats.absent} 
          icon={XCircle} 
          color="red" 
        />
        <StatCard 
          label="Late" 
          value={attendanceStats.late} 
          icon={Clock} 
          color="amber" 
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Attendance Overview</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Present</span>
              <span className="font-medium text-green-600">{attendanceStats.present} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${attendanceStats.total > 0 ? (attendanceStats.present / attendanceStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Late</span>
              <span className="font-medium text-amber-600">{attendanceStats.late} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-amber-500 h-2.5 rounded-full" 
                style={{ width: `${attendanceStats.total > 0 ? (attendanceStats.late / attendanceStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Absent</span>
              <span className="font-medium text-red-600">{attendanceStats.absent} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-red-500 h-2.5 rounded-full" 
                style={{ width: `${attendanceStats.total > 0 ? (attendanceStats.absent / attendanceStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Attendance History</h3>
          <p className="text-xs text-gray-500 mt-0.5">Complete record of daily attendance</p>
        </div>
        
        {attendanceRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No attendance records yet</p>
            <p className="text-sm text-gray-400 mt-1">Attendance will appear here once marked</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedByMonth).map(([month, records]) => (
              <div key={month}>
                <div className="bg-gray-50 px-5 py-2 border-b border-gray-100">
                  <h4 className="font-medium text-sm text-gray-700">{month}</h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {(records as any[]).map((record: any) => (
                    <div key={record.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{formatDateFull(record.date)}</p>
                          {record.remarks && (
                            <p className="text-xs text-gray-500 mt-0.5">{record.remarks}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      {attendanceRecords.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">School Days</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(groupedByMonth).map(([month, records]) => {
                  const present = records.filter((r: any) => r.status === 'PRESENT').length;
                  const absent = records.filter((r: any) => r.status === 'ABSENT').length;
                  const late = records.filter((r: any) => r.status === 'LATE').length;
                  const total = records.length;
                  const rate = total > 0 ? ((present + late) / total) * 100 : 0;
                  
                  return (
                    <tr key={month} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-sm">{month}</td>
                      <td className="py-2 px-3 text-center text-sm">{total}</td>
                      <td className="py-2 px-3 text-center text-sm text-green-600">{present}</td>
                      <td className="py-2 px-3 text-center text-sm text-red-600">{absent}</td>
                      <td className="py-2 px-3 text-center text-sm text-amber-600">{late}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`font-medium text-sm ${rate >= 75 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 mt-1 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="capitalize">{value}</span>
      </p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
      <div className={`${colors[color]} p-3 rounded-xl`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function GradeBadge({ grade, percentage }: { grade?: string; percentage?: number }) {
  if (!grade) return <span className="text-gray-400">—</span>;
  
  const colors: Record<string, string> = {
    A1: 'bg-green-100 text-green-700',
    B2: 'bg-green-50 text-green-600',
    B3: 'bg-emerald-50 text-emerald-600',
    C4: 'bg-yellow-50 text-yellow-600',
    C5: 'bg-yellow-50 text-yellow-600',
    C6: 'bg-yellow-50 text-yellow-600',
    D7: 'bg-orange-50 text-orange-600',
    E8: 'bg-orange-50 text-orange-600',
    F9: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[grade] || 'bg-gray-100 text-gray-600'}`}>
      {grade} {percentage && `(${percentage.toFixed(1)}%)`}
    </span>
  );
}
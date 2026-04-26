import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Users, GraduationCap, BookOpen, CreditCard, UserPlus, Megaphone, Calendar,
  TrendingUp, TrendingDown, Loader2, DollarSign, Award, Clock, Activity,
  CheckCircle, AlertCircle, ArrowRight, Receipt, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardStats } from '../../hooks/useReports';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { useActiveTerm } from '../../hooks/useExams';
import { useStudentResults } from '../../hooks/useExams';
import { useStudentFees } from '../../hooks/useFees';
import { useStudentAttendanceStats } from '../../hooks/useAttendance';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements();
  const { data: activeTerm } = useActiveTerm();
  
  // Student/Parent specific data
  const studentId = user?.studentId || (user?.role === 'PARENT' && user?.studentIds?.[0]);
  const { data: studentResults, isLoading: resultsLoading } = useStudentResults(studentId || '');
  const { data: studentFees, isLoading: feesLoading } = useStudentFees(studentId || '', activeTerm?.id);
  const { data: attendanceStats, isLoading: attendanceLoading } = useStudentAttendanceStats(studentId || '', activeTerm?.id);
  
  const displayName = user?.firstName 
    ? `${user.firstName} ${user.lastName}`
    : user?.name || user?.email?.split('@')[0] || 'Admin';

  const formatCurrency = (amount: number) => {
    return `₵${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const role = user?.role;
  const employeeType = user?.employeeType || user?.employee?.employeeType;
  
  // Updated role checks to support both legacy and new EMPLOYEE role
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isTeacher = role === 'TEACHER' || (role === 'EMPLOYEE' && employeeType === 'TEACHER');
  const isAccountant = role === 'ACCOUNTANT' || (role === 'EMPLOYEE' && employeeType === 'ACCOUNTANT');
  const isParent = role === 'PARENT';
  const isStudent = role === 'STUDENT';
  const isEmployee = role === 'EMPLOYEE';

  // Calculate student-specific stats
  const totalFeesPaid = studentFees?.reduce((sum: number, fee: any) => sum + (fee.amountPaid || 0), 0) || 0;
  const totalFeesExpected = studentFees?.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0) || 0;
  const averageScore = studentResults?.length 
    ? studentResults.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / studentResults.length 
    : 0;
  const attendanceRate = attendanceStats?.attendanceRate || 0;

  // Quick actions based on role
  const getQuickActions = () => {
    if (isAdmin || isAccountant) {
      return [
        { icon: UserPlus, label: 'Add Student', onClick: () => navigate('/students/add') },
        { icon: CreditCard, label: 'Record Payment', onClick: () => navigate('/fees/record') },
        { icon: Megaphone, label: 'Post Announcement', onClick: () => navigate('/announcements/add') },
        { icon: Calendar, label: 'Mark Attendance', onClick: () => navigate('/attendance') },
      ];
    }
    if (isTeacher) {
      return [
        { icon: Calendar, label: 'Mark Attendance', onClick: () => navigate('/attendance') },
        { icon: BookOpen, label: 'Enter Results', onClick: () => navigate('/exams') },
        { icon: Megaphone, label: 'Post Announcement', onClick: () => navigate('/announcements/add') },
        { icon: Users, label: 'View Students', onClick: () => navigate('/students') },
      ];
    }
    if (isStudent || isParent) {
      return [
        { icon: FileText, label: 'View Results', onClick: () => navigate('/exams') },
        { icon: Receipt, label: 'View Fees', onClick: () => navigate('/fees') },
        { icon: Megaphone, label: 'Announcements', onClick: () => navigate('/announcements') },
        { icon: Calendar, label: 'View Report Card', onClick: () => navigate('/report-cards') },
      ];
    }
    if (isEmployee) {
      return [
        { icon: BookOpen, label: 'My Classes', onClick: () => navigate('/classes') },
        { icon: Calendar, label: 'Attendance', onClick: () => navigate('/attendance') },
        { icon: Megaphone, label: 'Announcements', onClick: () => navigate('/announcements') },
        { icon: Users, label: 'Students', onClick: () => navigate('/students') },
      ];
    }
    return [
      { icon: BookOpen, label: 'View Results', onClick: () => navigate('/exams') },
      { icon: CreditCard, label: 'View Fees', onClick: () => navigate('/fees') },
      { icon: Megaphone, label: 'Announcements', onClick: () => navigate('/announcements') },
      { icon: Calendar, label: 'Timetable', onClick: () => navigate('/timetable') },
    ];
  };

  const quickActions = getQuickActions();

  // Student/Parent Dashboard
  if (isStudent || isParent) {
    const isLoadingStudentData = resultsLoading || feesLoading || attendanceLoading;
    
    if (isLoadingStudentData) {
      return (
        <DashboardLayout title="Dashboard">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isParent ? `Welcome, ${displayName}` : `Welcome back, ${displayName}!`}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isParent 
                ? "Here's an overview of your child's academic progress."
                : "Here's your academic progress and activities."}
            </p>
          </div>

          {/* Student Performance Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <Award className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-3xl font-bold text-gray-900 leading-tight">
                  {averageScore.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Across all subjects</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-900 leading-tight">
                  {attendanceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {attendanceStats?.present || 0} / {attendanceStats?.total || 0} days
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Fees Paid</p>
                <p className="text-3xl font-bold text-gray-900 leading-tight">
                  {formatCurrency(totalFeesPaid)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  of {formatCurrency(totalFeesExpected)} total
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-xl">
                <CreditCard className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className={`text-2xl font-bold leading-tight ${
                  totalFeesPaid >= totalFeesExpected ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {totalFeesPaid >= totalFeesExpected ? 'Fully Paid' : 'Partial Payment'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Balance: {formatCurrency(totalFeesExpected - totalFeesPaid)}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Results & Fee History */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Recent Exam Results</h3>
                </div>
                <button onClick={() => navigate('/exams')} className="text-sm text-[#1a3d30] hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              {studentResults && studentResults.length > 0 ? (
                <div className="space-y-3">
                  {studentResults.slice(0, 5).map((result: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{result.examSubject?.subject?.name}</p>
                        <p className="text-xs text-gray-400">{result.examSubject?.exam?.type?.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          (result.marksObtained || 0) >= (result.examSubject?.totalMarks || 100) / 2 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {result.marksObtained || 0}/{result.examSubject?.totalMarks || 100}
                        </p>
                        <p className="text-xs text-gray-500">{result.percentage?.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No results available yet</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Recent Fee Payments</h3>
                </div>
                <button onClick={() => navigate('/fees')} className="text-sm text-[#1a3d30] hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              {studentFees && studentFees.filter((f: any) => f.paymentDate).length > 0 ? (
                <div className="space-y-3">
                  {studentFees
                    .filter((fee: any) => fee.paymentDate)
                    .slice(0, 5)
                    .map((fee: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{fee.feeStructure?.feeType?.name || 'Fee Payment'}</p>
                          <p className="text-xs text-gray-400">Receipt: {fee.receiptNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(fee.amountPaid)}</p>
                          <p className="text-xs text-gray-400">{new Date(fee.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No fee payments recorded</p>
                </div>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Recent Announcements</h3>
              </div>
              <button onClick={() => navigate('/announcements')} className="text-sm text-[#1a3d30] hover:underline">View All</button>
            </div>
            
            {announcementsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1a3d30]" /></div>
            ) : announcements.length === 0 ? (
              <div className="border border-gray-100 rounded-xl p-4"><p className="text-gray-500 text-sm text-center">No announcements yet</p></div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-gray-800 text-sm">{announcement.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(announcement.createdAt)}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{announcement.content}</p>
                    <div className="mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        announcement.priority === 'HIGH' ? 'bg-red-100 text-red-600' :
                        announcement.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>{announcement.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map(({ icon: Icon, label, onClick }) => (
                <button key={label} onClick={onClick} className="flex flex-col items-center gap-2 py-3 px-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition-colors">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-xs text-gray-600 leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin/Teacher/Accountant Dashboard
  if (statsLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h2>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening in your school today.</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl"><Users className="w-6 h-6 text-blue-500" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Total Students</p><span className="flex items-center gap-0.5 text-xs font-medium text-green-600"><TrendingUp className="w-3 h-3" /> +12</span></div>
              <p className="text-3xl font-bold text-gray-900 leading-tight">{stats?.students.total || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl"><GraduationCap className="w-6 h-6 text-emerald-600" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Total Employees</p><span className="flex items-center gap-0.5 text-xs font-medium text-green-600"><TrendingUp className="w-3 h-3" /> +2</span></div>
              <p className="text-3xl font-bold text-gray-900 leading-tight">{stats?.employees?.total || stats?.teachers?.total || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-xl"><BookOpen className="w-6 h-6 text-amber-500" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Active Classes</p><span className="flex items-center gap-0.5 text-xs font-medium text-green-600"><TrendingUp className="w-3 h-3" /> +1</span></div>
              <p className="text-3xl font-bold text-gray-900 leading-tight">{stats?.students.byClass.length || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-xl"><DollarSign className="w-6 h-6 text-purple-500" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Collection Rate</p><span className="flex items-center gap-0.5 text-xs font-medium text-green-600"><TrendingUp className="w-3 h-3" /> +5.2%</span></div>
              <p className="text-3xl font-bold text-gray-900 leading-tight">{stats?.finances.collectionRate.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><CreditCard className="w-5 h-5 text-purple-500" /><span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">This Term</span></div>
            <p className="text-sm text-gray-500">Fees Collected</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats?.finances.totalCollected || 0)}</p>
            <p className="text-xs text-gray-400 mt-1">of {formatCurrency(stats?.finances.totalExpected || 0)} expected</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><Award className="w-5 h-5 text-amber-500" /><span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Avg</span></div>
            <p className="text-sm text-gray-500">Academic Performance</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.academics.averagePerformance.toFixed(1) || 0}%</p>
            <p className="text-xs text-gray-400 mt-1">Across all subjects</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><Clock className="w-5 h-5 text-blue-500" /><span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">30 days</span></div>
            <p className="text-sm text-gray-500">Attendance Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.attendance.averageAttendance.toFixed(1) || 0}%</p>
            <p className="text-xs text-gray-400 mt-1">School-wide average</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><Activity className="w-5 h-5 text-green-500" /><span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span></div>
            <p className="text-sm text-gray-500">Active Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.students.active || 0}</p>
            <p className="text-xs text-gray-400 mt-1">of {stats?.students.total || 0} total</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-gray-600" /><h3 className="font-semibold text-gray-800">Recent Announcements</h3></div><button onClick={() => navigate('/announcements')} className="text-sm text-[#1a3d30] cursor-pointer hover:underline">View All</button></div>
            {announcementsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1a3d30]" /></div>
            ) : announcements.length === 0 ? (
              <div className="border border-gray-100 rounded-xl p-4"><p className="text-gray-500 text-sm text-center">No announcements yet</p></div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 2).map((announcement) => (
                  <div key={announcement.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-1"><p className="font-semibold text-gray-800 text-sm">{announcement.title}</p><p className="text-xs text-gray-400">{formatDate(announcement.createdAt)}</p></div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{announcement.content}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${announcement.priority === 'HIGH' ? 'bg-red-100 text-red-600' : announcement.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{announcement.priority}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">By {announcement.author?.firstName} {announcement.author?.lastName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(({ icon: Icon, label, onClick }) => (
                  <button key={label} onClick={onClick} className="flex flex-col items-center gap-1.5 py-3 px-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition-colors">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1a3d30] rounded-2xl p-4 text-white">
              <p className="font-semibold text-sm mb-3">Current Academic Period</p>
              {activeTerm ? (
                <>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-white/60">Year:</span><span className="font-semibold">{activeTerm.academicYear}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Term:</span><span className="font-semibold">{activeTerm.name}</span></div>
                  </div>
                  <p className="text-xs text-white/40 mt-3">{formatDate(activeTerm.startDate)} - {formatDate(activeTerm.endDate)}</p>
                </>
              ) : (
                <>
                  <div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-white/60">Year:</span><span className="font-semibold">2024-2025</span></div><div className="flex justify-between"><span className="text-white/60">Term:</span><span className="font-semibold">Second Term</span></div></div>
                  <p className="text-xs text-white/40 mt-3">No active term set</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
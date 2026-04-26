import { useState, useMemo } from 'react';
import {
  Users, GraduationCap, DollarSign, BookOpen, TrendingUp,
  Loader2, Download, BarChart3, Clock, Award, AlertCircle,
  FileText, Printer, Filter, X, CheckCircle, XCircle, CreditCard,
  Banknote, Smartphone, Wallet, ArrowUpRight, ArrowDownRight, Briefcase,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  useDashboardStats,
  useFinancialReport,
  useAttendanceReport,
  useEmployeeReport,
} from '../../hooks/useReports';
import { useAuth } from '../../context/AuthContext';
import { useTerms } from '../../hooks/useExams';
import { useClasses } from '../../hooks/useClasses';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['#1a3d30', '#2a5d50', '#3a7d70', '#4a9d90', '#5abdb0', '#6addd0', '#7aede0'];
const METHOD_ICONS: Record<string, any> = {
  CASH: Banknote,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: CreditCard,
  CHEQUE: CreditCard,
  ONLINE: CreditCard,
};

type TabType = 'overview' | 'students' | 'employees' | 'finances' | 'academics' | 'attendance';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: terms = [] } = useTerms();
  const { data: classes = [] } = useClasses();
  const { data: employeeStats, isLoading: employeeLoading } = useEmployeeReport();

  const canViewAllReports = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canViewFinances = canViewAllReports || user?.role === 'ACCOUNTANT';
  const canViewAcademics = canViewAllReports || user?.role === 'TEACHER';
  const canViewAttendance = canViewAllReports || user?.role === 'TEACHER';

  const reportFilters = useMemo(() => {
    const filters: { startDate?: string; endDate?: string; termId?: string; classId?: string } = {};
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    if (selectedTerm) filters.termId = selectedTerm;
    if (selectedClass) filters.classId = selectedClass;
    return filters;
  }, [selectedTerm, selectedClass, dateRange.startDate, dateRange.endDate]);

  const formatCurrency = (amount: number) =>
    `₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3, allowed: true },
    { id: 'students' as TabType, label: 'Students', icon: Users, allowed: true },
    { id: 'employees' as TabType, label: 'Employees', icon: Briefcase, allowed: canViewAllReports },
    { id: 'finances' as TabType, label: 'Finances', icon: DollarSign, allowed: canViewFinances },
    { id: 'academics' as TabType, label: 'Academics', icon: BookOpen, allowed: canViewAcademics },
    { id: 'attendance' as TabType, label: 'Attendance', icon: Clock, allowed: canViewAttendance },
  ].filter(tab => tab.allowed);

  if (statsLoading) {
    return (
      <DashboardLayout title="Reports">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-500 text-sm mt-1">Comprehensive insights across all school operations</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" /> Filters
              {(selectedTerm || selectedClass || dateRange.startDate) && (
                <span className="w-2 h-2 rounded-full bg-[#1a3d30]" />
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => alert('Export coming soon!')}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48"
                >
                  <option value="">All Terms</option>
                  {terms.map((term: any) => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(d => ({ ...d, startDate: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(d => ({ ...d, endDate: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedTerm('');
                  setSelectedClass('');
                  setDateRange({ startDate: '', endDate: '' });
                }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 pb-0.5"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
            {(selectedTerm || selectedClass) && (
              <p className="text-xs text-[#1a3d30] mt-2 font-medium">
                ✓ Filters active — data below updates automatically
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
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

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <MetricCard icon={Users} label="Total Students" value={stats.students?.total ?? 0} color="blue" />
              <MetricCard icon={Briefcase} label="Total Employees" value={stats.employees?.total ?? stats.teachers?.total ?? 0} color="green" />
              <MetricCard icon={BookOpen} label="Active Classes" value={stats.students?.byClass?.length ?? 0} color="amber" />
              <MetricCard icon={DollarSign} label="Collection Rate" value={`${(stats.finances?.collectionRate ?? 0).toFixed(1)}%`} color="purple" />
              <MetricCard icon={Clock} label="Attendance Rate" value={`${(stats.attendance?.averageAttendance ?? 0).toFixed(1)}%`} color="orange" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Student Distribution by Class</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.students?.byClass ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1a3d30" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: stats.students?.byGender?.male ?? 0 },
                        { name: 'Female', value: stats.students?.byGender?.female ?? 0 },
                        { name: 'Other', value: stats.students?.byGender?.other ?? 0 },
                      ]}
                      cx="50%" cy="50%" outerRadius={80}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      dataKey="value"
                    >
                      {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">🏆 Top Performers</h3>
              <div className="space-y-3">
                {(stats.academics?.topPerformers ?? []).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-[#1a3d30]'
                      }`}>{i + 1}</div>
                      <div>
                        <p className="font-medium text-gray-900">{p.student}</p>
                        <p className="text-xs text-gray-500">{p.subject}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-[#1a3d30]">{(p.score ?? 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENTS ── */}
        {activeTab === 'students' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <StatBox label="Total Students" value={stats.students?.total ?? 0} icon={Users} color="blue" />
              <StatBox label="Active Students" value={stats.students?.active ?? 0} icon={CheckCircle} color="green" />
              <StatBox label="New This Term" value={stats.students?.newThisTerm ?? 0} icon={TrendingUp} color="purple" />
              <StatBox label="Classes" value={stats.students?.byClass?.length ?? 0} icon={BookOpen} color="amber" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Students by Class</h3>
                <div className="space-y-2">
                  {(stats.students?.byClass ?? []).map((cls: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{cls.className}</span>
                      <span className="text-lg font-bold text-[#1a3d30]">{cls.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Gender Breakdown</h3>
                <div className="space-y-3">
                  <GenderBar label="Male" value={stats.students?.byGender?.male ?? 0} total={stats.students?.total || 1} color="blue" />
                  <GenderBar label="Female" value={stats.students?.byGender?.female ?? 0} total={stats.students?.total || 1} color="pink" />
                  <GenderBar label="Other" value={stats.students?.byGender?.other ?? 0} total={stats.students?.total || 1} color="purple" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EMPLOYEES ── */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            {employeeLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
              </div>
            ) : !employeeStats ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No employee data available</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-4">
                  <StatBox label="Total Employees" value={employeeStats.totalEmployees ?? 0} icon={Briefcase} color="blue" />
                  <StatBox label="Active Employees" value={employeeStats.activeEmployees ?? 0} icon={CheckCircle} color="green" />
                  <StatBox label="Teachers" value={employeeStats.byType?.TEACHER ?? 0} icon={GraduationCap} color="purple" />
                  <StatBox label="Accountants" value={employeeStats.byType?.ACCOUNTANT ?? 0} icon={DollarSign} color="amber" />
                  <StatBox label="Admin Staff" value={employeeStats.byType?.ADMIN_STAFF ?? 0} icon={Users} color="orange" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Employee Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(employeeStats.byType ?? {}).map(([type, count]) => ({ type, count }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1a3d30" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">By Qualification</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={employeeStats.byQualification ?? []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="qualification" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2a5d50" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">By Department</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={employeeStats.byDepartment ?? []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="department" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3a7d70" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Gender Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Male', value: employeeStats.byGender?.male ?? 0 },
                            { name: 'Female', value: employeeStats.byGender?.female ?? 0 },
                            { name: 'Other', value: employeeStats.byGender?.other ?? 0 },
                          ]}
                          cx="50%" cy="50%" outerRadius={80}
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          dataKey="value"
                        >
                          {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── FINANCES ── */}
        {activeTab === 'finances' && (
          <FinanceTabContent filters={reportFilters} formatCurrency={formatCurrency} />
        )}

        {/* ── ACADEMICS ── */}
        {activeTab === 'academics' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <StatBox label="Total Exams" value={stats.academics?.totalExams ?? 0} icon={FileText} color="blue" />
              <StatBox label="Published" value={stats.academics?.publishedExams ?? 0} icon={CheckCircle} color="green" />
              <StatBox
                label="Avg Performance"
                value={`${(stats.academics?.averagePerformance ?? 0).toFixed(1)}%`}
                icon={Award}
                color="amber"
              />
              <StatBox label="Subjects" value={stats.academics?.bySubject?.length ?? 0} icon={BookOpen} color="purple" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Performance by Subject</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.academics?.bySubject ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="subject" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#1a3d30" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {activeTab === 'attendance' && (
          <AttendanceTabContent filters={reportFilters} />
        )}

      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE TAB
// ─────────────────────────────────────────────────────────────────────────────
function FinanceTabContent({
  filters,
  formatCurrency,
}: {
  filters: any;
  formatCurrency: (n: number) => string;
}) {
  const [activeFinanceTab, setActiveFinanceTab] = useState
    'overview' | 'byClass' | 'byFeeType' | 'outstanding' | 'transactions'
  >('overview');

  const { data: report, isLoading } = useFinancialReport(filters);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  const { summary, dailyTrend, recentTransactions, outstandingList } = report;

  const financeTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'byClass', label: 'By Class' },
    { id: 'byFeeType', label: 'By Fee Type' },
    { id: 'outstanding', label: `Outstanding (${outstandingList?.length ?? 0})` },
    { id: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Expected Revenue</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totalExpected ?? 0)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Collected</p>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(summary?.totalCollected ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{(summary?.collectionRate ?? 0).toFixed(1)}% collection rate</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(summary?.totalOutstanding ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{outstandingList?.length ?? 0} students with balance</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Collection Rate</p>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-gray-900">{(summary?.collectionRate ?? 0).toFixed(1)}%</p>
            {(summary?.collectionRate ?? 0) >= 75
              ? <ArrowUpRight className="w-5 h-5 text-green-500 mb-0.5" />
              : <ArrowDownRight className="w-5 h-5 text-red-500 mb-0.5" />}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-[#1a3d30] h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(summary?.collectionRate ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Finance Sub-Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {financeTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFinanceTab(tab.id as any)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeFinanceTab === tab.id
                  ? 'border-[#1a3d30] text-[#1a3d30]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Overview ── */}
      {activeFinanceTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Collections (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={v => v?.slice(5) ?? ''} />
                  <YAxis tickFormatter={v => `₵${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} labelFormatter={l => `Date: ${l}`} />
                  <Line type="monotone" dataKey="amount" stroke="#1a3d30" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h3>
              {(summary?.byPaymentMethod?.length ?? 0) > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <RePieChart>
                      <Pie
                        data={summary.byPaymentMethod}
                        dataKey="amount"
                        cx="50%" cy="50%"
                        outerRadius={60}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {summary.byPaymentMethod.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {summary.byPaymentMethod.map((m: any, i: number) => {
                      const Icon = METHOD_ICONS[m.method] ?? Wallet;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <Icon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-600 capitalize">
                              {m.method?.replace(/_/g, ' ')?.toLowerCase() ?? ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{formatCurrency(m.amount)}</span>
                            <span className="text-gray-400 ml-2">({m.count})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  No payment data
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Collection by Term</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary?.byTerm ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="term" />
                <YAxis tickFormatter={v => `₵${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="expected" fill="#94a3b8" name="Expected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill="#1a3d30" name="Collected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── By Class ── */}
      {activeFinanceTab === 'byClass' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Fee Collection by Class</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Expected</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Collected</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(summary?.byClass ?? []).map((cls: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{cls.class}</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600">{formatCurrency(cls.expected)}</td>
                  <td className="py-3 px-4 text-right text-sm text-green-700 font-medium">{formatCurrency(cls.collected)}</td>
                  <td className="py-3 px-4 text-right text-sm text-red-600">{formatCurrency(cls.expected - cls.collected)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-[#1a3d30] h-2 rounded-full"
                          style={{ width: `${Math.min(cls.rate ?? 0, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-12 text-right ${(cls.rate ?? 0) >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                        {(cls.rate ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── By Fee Type ── */}
      {activeFinanceTab === 'byFeeType' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Collection by Fee Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary?.byFeeType ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `₵${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="type" type="category" width={120} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="expected" fill="#94a3b8" name="Expected" radius={[0, 4, 4, 0]} />
                <Bar dataKey="collected" fill="#1a3d30" name="Collected" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Expected</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Collected</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(summary?.byFeeType ?? []).map((ft: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{ft.type}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{ft.category}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{formatCurrency(ft.expected)}</td>
                    <td className="py-3 px-4 text-right text-sm text-green-700 font-medium">{formatCurrency(ft.collected)}</td>
                    <td className="py-3 px-4 text-right text-sm text-red-600">{formatCurrency(ft.expected - ft.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Outstanding ── */}
      {activeFinanceTab === 'outstanding' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Students with Outstanding Balances</h3>
            {(outstandingList?.length ?? 0) > 0 && (
              <span className="ml-auto text-sm text-amber-700 font-medium">
                Total: {formatCurrency(outstandingList.reduce((s: number, o: any) => s + (o.totalDue ?? 0), 0))}
              </span>
            )}
          </div>
          {(outstandingList?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">All fees are fully paid! 🎉</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total Fees</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outstandingList.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{s.student}</td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-500">{s.admissionNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.class}</td>
                    <td className="py-3 px-4 text-right text-sm">{formatCurrency(s.totalFees ?? 0)}</td>
                    <td className="py-3 px-4 text-right text-sm text-green-600">{formatCurrency(s.totalPaid ?? 0)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-red-600">{formatCurrency(s.totalDue ?? 0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Transactions ── */}
      {activeFinanceTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Receipt</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(recentTransactions ?? []).map((t: any, i: number) => {
                const Icon = METHOD_ICONS[t.method] ?? Wallet;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{t.receiptNumber}</td>
                    <td className="py-3 px-4 font-medium text-sm text-gray-900">{t.student}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{t.class}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{t.feeType}</td>
                    <td className="py-3 px-4 text-right font-medium text-sm">{formatCurrency(t.amount ?? 0)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 capitalize">
                          {t.method?.replace(/_/g, ' ')?.toLowerCase() ?? ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(recentTransactions?.length ?? 0) === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No transactions found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE TAB
// ─────────────────────────────────────────────────────────────────────────────
function AttendanceTabContent({ filters }: { filters: any }) {
  const hasFilters = !!(
    filters?.classId || filters?.termId || filters?.startDate || filters?.endDate
  );

  const { data: report, isLoading } = useAttendanceReport(
    hasFilters ? filters : undefined
  );

  if (!hasFilters) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Select Filters to View Attendance</h3>
        <p className="text-gray-500 text-sm">
          Use the Filters panel above to select a term, class, or date range.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No attendance data found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-4">
        <StatBox
          label="Overall Rate"
          value={`${(report.summary?.overallRate ?? 0).toFixed(1)}%`}
          icon={Clock}
          color={(report.summary?.overallRate ?? 0) >= 75 ? 'green' : 'amber'}
        />
        <StatBox label="Total Students" value={report.summary?.totalStudents ?? 0} icon={Users} color="blue" />
        <StatBox label="Total Records" value={report.summary?.totalRecords ?? 0} icon={FileText} color="purple" />
        <StatBox label="Present" value={report.summary?.presentRecords ?? 0} icon={CheckCircle} color="green" />
        <StatBox label="Absent" value={report.summary?.absentRecords ?? 0} icon={XCircle} color="red" />
        <StatBox label="Late" value={report.summary?.lateRecords ?? 0} icon={Clock} color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Attendance Rate by Class</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report.byClass ?? []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="className" type="category" width={100} />
            <Tooltip formatter={(v: any) => `${v.toFixed(1)}%`} />
            <Bar dataKey="rate" fill="#1a3d30" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={(report.byDay ?? []).slice(-30)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={v => v?.slice(5) ?? ''} />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(v: any) => `${v.toFixed(1)}%`} />
            <Line type="monotone" dataKey="rate" stroke="#1a3d30" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {(report.lowAttendanceStudents?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Students Below 75% Attendance</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Adm. No.</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Present</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(report.lowAttendanceStudents ?? []).map((s: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.student}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{s.class}</td>
                  <td className="py-3 px-4 text-sm font-mono text-gray-500">{s.admissionNumber}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${(s.attendanceRate ?? 0) < 50 ? 'text-red-600' : 'text-amber-600'}`}>
                      {(s.attendanceRate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-green-600">{s.daysPresent ?? 0}</td>
                  <td className="py-3 px-4 text-center text-red-600">{s.daysAbsent ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Class Details Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Class Attendance Details</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Present</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Absent</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Late</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(report.byClass ?? []).map((cls: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{cls.className}</td>
                <td className="py-3 px-4 text-center text-sm">{cls.total ?? 0}</td>
                <td className="py-3 px-4 text-center text-sm text-green-600">{cls.present ?? 0}</td>
                <td className="py-3 px-4 text-center text-sm text-red-600">{cls.absent ?? 0}</td>
                <td className="py-3 px-4 text-center text-sm text-amber-600">{cls.late ?? 0}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`font-bold text-sm ${(cls.rate ?? 0) >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                    {(cls.rate ?? 0).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`${colors[color] ?? colors.blue} p-2 rounded-lg w-fit mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`${colors[color] ?? colors.blue} p-3 rounded-xl`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function GenderBar({ label, value, total, color }: any) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const barColors: Record<string, string> = {
    blue: 'bg-blue-500',
    pink: 'bg-pink-500',
    purple: 'bg-purple-500',
  };
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${barColors[color] ?? 'bg-gray-500'} h-2 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
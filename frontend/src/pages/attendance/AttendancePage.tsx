import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, XCircle, Clock, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useClasses } from '../../hooks/useClasses';
import { useClassAttendance, useMarkBulkAttendance } from '../../hooks/useAttendance';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';

export default function AttendancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [canMarkAttendance, setCanMarkAttendance] = useState(false);
  const [canViewStudents, setCanViewStudents] = useState(false);
  const [isUnassignedTeacher, setIsUnassignedTeacher] = useState(false);

  const { data: adminClasses = [] } = useClasses();
  const { data: teacherClassesData, isLoading: teacherClassesLoading } = useTeacherAccessibleClasses();
  const { data: classAttendance, isLoading: attendanceLoading, refetch } = useClassAttendance(selectedClass, selectedDate);
  const markBulkAttendance = useMarkBulkAttendance();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  // Determine classes and permissions based on role
  useEffect(() => {
    if (isAdmin) {
      // Admin has full access to all classes
      setTeacherClasses(adminClasses.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        gradeLevel: cls.gradeLevel,
        canMarkAttendance: true,
        canViewStudents: true,
        accessType: 'ADMIN'
      })));
      setCanMarkAttendance(true);
      setCanViewStudents(true);
      setIsUnassignedTeacher(false);
    } else if (isTeacher && teacherClassesData) {
      // Teacher has permissions based on assignments
      setTeacherClasses(teacherClassesData);
      const hasMarkPermission = teacherClassesData.some((c: any) => c.canMarkAttendance === true);
      const hasViewPermission = teacherClassesData.some((c: any) => c.canViewStudents === true);
      setCanMarkAttendance(hasMarkPermission);
      setCanViewStudents(hasViewPermission);
      
      // Check if teacher has no assignments at all
      const isUnassigned = teacherClassesData.length > 0 && teacherClassesData[0]?.accessType === 'VIEW_ONLY';
      setIsUnassignedTeacher(isUnassigned);
    }
  }, [isAdmin, isTeacher, adminClasses, teacherClassesData]);

  // Initialize attendance from existing data
  useEffect(() => {
    if (classAttendance && classAttendance.length > 0) {
      const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
      classAttendance.forEach((item: any) => {
        if (item.attendance) {
          initial[item.student.id] = item.attendance.status;
        } else {
          initial[item.student.id] = 'PRESENT';
        }
      });
      setAttendance(initial);
    } else if (classAttendance && classAttendance.length === 0) {
      const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
      classAttendance.forEach((item: any) => {
        initial[item.student.id] = 'PRESENT';
      });
      setAttendance(initial);
    }
  }, [classAttendance]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (!canMarkAttendance) return;
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (!canMarkAttendance) return;
    const newAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    classAttendance?.forEach((item: any) => {
      newAttendance[item.student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }
    if (!canMarkAttendance) {
      alert('You do not have permission to mark attendance');
      return;
    }

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      await markBulkAttendance.mutateAsync({
        classId: selectedClass,
        date: selectedDate,
        records,
      });
      alert('Attendance saved successfully!');
      await refetch();
    } catch (error: any) {
      console.error('Save error:', error);
      alert(error.response?.data?.message || 'Failed to save attendance');
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    const newDate = date.toISOString().split('T')[0];
    setSelectedDate(newDate);
    setAttendance({});
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setAttendance({});
  };

  // Show loading state
  if (teacherClassesLoading || (isAdmin && !adminClasses.length)) {
    return (
      <DashboardLayout title="Attendance">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show unassigned teacher message
  if (isTeacher && isUnassignedTeacher) {
    return (
      <DashboardLayout title="Attendance">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Class Assignment</h3>
          <p className="text-yellow-700 mb-4">
            You are not assigned to any class as a Class Teacher or Subject Teacher.
          </p>
          <p className="text-yellow-600 text-sm">
            Please contact the administrator to get class assignments. Once assigned, you'll be able to:
          </p>
          <ul className="text-sm text-yellow-600 mt-2 space-y-1">
            <li>• Class Teachers: Mark attendance for their class</li>
            <li>• Subject Teachers: View attendance for classes they teach</li>
          </ul>
        </div>
      </DashboardLayout>
    );
  }

  // Show no permission message for teachers who can't view students
  if (isTeacher && !canViewStudents && teacherClasses.length > 0) {
    return (
      <DashboardLayout title="Attendance">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">View Only Access</h3>
          <p className="text-blue-700 mb-4">
            You can see class names but not student attendance details.
          </p>
          <p className="text-blue-600 text-sm">
            To view attendance, you need to be assigned as either:
          </p>
          <ul className="text-sm text-blue-600 mt-2 space-y-1">
            <li>• Class Teacher (can mark and view attendance)</li>
            <li>• Subject Teacher (can view attendance for your subjects)</li>
          </ul>
        </div>
      </DashboardLayout>
    );
  }

  const selectedClassData = teacherClasses.find(c => c.id === selectedClass);
  const userCanMarkForSelectedClass = selectedClassData?.canMarkAttendance || isAdmin;
  const userCanViewForSelectedClass = selectedClassData?.canViewStudents || isAdmin;

  const filteredStudents = classAttendance?.filter((item: any) => {
    const fullName = `${item.student.firstName} ${item.student.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
      item.student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter((s: any) => attendance[s.student.id] === 'PRESENT').length,
    absent: filteredStudents.filter((s: any) => attendance[s.student.id] === 'ABSENT').length,
    late: filteredStudents.filter((s: any) => attendance[s.student.id] === 'LATE').length,
  };

  return (
    <DashboardLayout title="Attendance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
            <p className="text-gray-500 text-sm mt-1">Mark and manage student attendance</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-64">
              <label className="block text-xs font-medium text-gray-500 mb-1">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a class</option>
                {teacherClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} 
                    {cls.accessType === 'VIEW_ONLY' && ' (View Only)'}
                    {cls.accessType === 'SUBJECT_TEACHER' && ' (Subject Teacher)'}
                    {cls.accessType === 'CLASS_TEACHER' && ' (Class Teacher)'}
                    {cls.accessType === 'ADMIN' && ' (Admin)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <div className="flex items-center gap-2">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1" />
            {selectedClass && userCanMarkForSelectedClass && (
              <button
                onClick={handleSave}
                disabled={markBulkAttendance.isPending}
                className="px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
              >
                {markBulkAttendance.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                    Saving...
                  </>
                ) : (
                  'Save Attendance'
                )}
              </button>
            )}
          </div>
        </div>

        {selectedClass && userCanViewForSelectedClass && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total Students" value={stats.total} icon={Users} color="blue" />
              <StatCard label="Present" value={stats.present} icon={CheckCircle} color="green" />
              <StatCard label="Absent" value={stats.absent} icon={XCircle} color="red" />
              <StatCard label="Late" value={stats.late} icon={Clock} color="amber" />
            </div>

            {/* Quick Actions - Only show if teacher can mark */}
            {userCanMarkForSelectedClass && filteredStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Mark all as:</span>
                <button onClick={() => handleMarkAll('PRESENT')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">Present</button>
                <button onClick={() => handleMarkAll('ABSENT')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Absent</button>
                <button onClick={() => handleMarkAll('LATE')} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200">Late</button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {attendanceLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1a3d30]" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm ? 'No students match your search' : 'No students in this class'}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((item: any) => (
                      <tr key={item.student.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{item.student.firstName} {item.student.lastName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">{item.student.admissionNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {userCanMarkForSelectedClass ? (
                              <>
                                <StatusButton
                                  status="PRESENT"
                                  current={attendance[item.student.id] || 'PRESENT'}
                                  onClick={() => handleStatusChange(item.student.id, 'PRESENT')}
                                />
                                <StatusButton
                                  status="ABSENT"
                                  current={attendance[item.student.id] || 'PRESENT'}
                                  onClick={() => handleStatusChange(item.student.id, 'ABSENT')}
                                />
                                <StatusButton
                                  status="LATE"
                                  current={attendance[item.student.id] || 'PRESENT'}
                                  onClick={() => handleStatusChange(item.student.id, 'LATE')}
                                />
                              </>
                            ) : (
                              <StatusBadge status={item.attendance?.status || attendance[item.student.id] || 'PRESENT'} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {selectedClass && !userCanViewForSelectedClass && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800">
              You don't have permission to view attendance for this class.
              {isTeacher && ' Only Class Teachers and Subject Teachers can view attendance.'}
            </p>
          </div>
        )}

        {!selectedClass && teacherClasses.length > 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Select a class to view attendance</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
      <div className={`${colors[color]} p-2 rounded-lg`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusButton({ status, current, onClick }: any) {
  const isActive = current === status;
  const colors: Record<string, string> = {
    PRESENT: isActive ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-green-100',
    ABSENT: isActive ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-red-100',
    LATE: isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-amber-100',
  };
  const labels: Record<string, string> = { PRESENT: 'P', ABSENT: 'A', LATE: 'L' };
  return (
    <button onClick={onClick} className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${colors[status]}`}>
      {labels[status]}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    LATE: 'bg-amber-100 text-amber-700',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>;
}
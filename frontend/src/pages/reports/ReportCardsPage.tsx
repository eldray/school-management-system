import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Loader2, Download, Eye, Printer, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useClasses } from '../../hooks/useClasses';
import { useTerms } from '../../hooks/useExams';
import { useStudents } from '../../hooks/useStudents';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';

export default function ReportCardsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allClasses = [] } = useClasses();
  const { data: terms = [] } = useTerms();
  const { data: allStudents = [], isLoading } = useStudents();
  const { data: teacherClassesData, isLoading: teacherClassesLoading } = useTeacherAccessibleClasses();

  const activeTerm = terms.find(t => t.isActive);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isParent = user?.role === 'PARENT';
  const isStudent = user?.role === 'STUDENT';

  // Determine which classes teacher can view
  let visibleClasses: any[] = [];
  let canGenerateReports = false;

  if (isAdmin) {
    visibleClasses = allClasses;
    canGenerateReports = true;
  } else if (isTeacher && teacherClassesData) {
    visibleClasses = teacherClassesData.filter((c: any) => c.canViewStudents === true);
    canGenerateReports = visibleClasses.length > 0;
  }

  const visibleClassIds = visibleClasses.map((c: any) => c.id);

  // Filter students based on role and permissions
  let filteredStudents = allStudents;
  
  if (isParent) {
    // Parents only see their children
    filteredStudents = allStudents.filter(student => 
      user?.parentProfile?.students?.some(s => s.id === student.id)
    );
  } else if (isStudent) {
    // Students only see themselves
    filteredStudents = allStudents.filter(student => student.userId === user?.id);
  } else if (isTeacher && visibleClassIds.length > 0) {
    // Teachers only see students in classes they have access to
    filteredStudents = allStudents.filter(student => visibleClassIds.includes(student.classId));
  }

  // Apply class filter (for teachers, only classes they have access to)
  filteredStudents = filteredStudents.filter(student => {
    if (selectedClass && isTeacher) {
      return student.classId === selectedClass;
    }
    if (selectedClass && isAdmin) {
      return student.classId === selectedClass;
    }
    return true;
  });

  // Apply search filter
  filteredStudents = filteredStudents.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const displayTerm = selectedTerm || activeTerm?.id;

  if (isTeacher && teacherClassesLoading) {
    return (
      <DashboardLayout title="Report Cards">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show message for unassigned teachers
  if (isTeacher && (!teacherClassesData || teacherClassesData.length === 0 || !canGenerateReports)) {
    return (
      <DashboardLayout title="Report Cards">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Report Card Access</h3>
          <p className="text-yellow-700 mb-4">
            You don't have access to view report cards.
          </p>
          <p className="text-yellow-600 text-sm">
            Only Class Teachers and Subject Teachers can view report cards for the classes they are assigned to.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Report Cards">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Report Cards</h2>
          <p className="text-gray-500 text-sm mt-1">View and generate student report cards</p>
        </div>

        {/* Info Banner for Teachers */}
        {isTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              You can view report cards for students in classes you are assigned to as Class Teacher or Subject Teacher.
            </p>
          </div>
        )}

        {/* Filters */}
        {!isParent && !isStudent && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Classes</option>
                  {visibleClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                      {cls.accessType === 'CLASS_TEACHER' && ' (Class Teacher)'}
                      {cls.accessType === 'SUBJECT_TEACHER' && ' (Subject Teacher)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select Term</option>
                  {terms.map(term => (
                    <option key={term.id} value={term.id}>{term.name} {term.isActive && '(Active)'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or admission no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              {isTeacher && selectedClass 
                ? 'No students found in this class'
                : 'No students found'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Term</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{student.firstName} {student.lastName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.admissionNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.class?.name || '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {terms.find(t => t.id === displayTerm)?.name || 'Select Term'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        Ready
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {displayTerm && (
                          <button
                            onClick={() => navigate(`/report-cards/${student.id}/${displayTerm}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                            title="View Report Card"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                          title="Download PDF"
                          onClick={() => window.open(`/api/report-cards/${student.id}/${displayTerm}/pdf`, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                          title="Print"
                          onClick={() => window.print()}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Generate All Button (Admin only - Class Teachers cannot generate bulk) */}
        {isAdmin && selectedClass && displayTerm && filteredStudents.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/report-cards/class/${selectedClass}/${displayTerm}`)}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <FileText className="w-4 h-4" />
              Generate All Report Cards for This Class
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
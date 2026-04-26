import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserCheck, BookOpen, Pencil, Trash2, Loader2, UserPlus, Library, Calendar, Clock, Award, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useClass, useAssignTeacher, useRemoveTeacher, useAvailableTeachers } from '../../hooks/useClasses';
import { useAuth } from '../../context/AuthContext';
import { useClassSubjects } from '../../hooks/useSubjects';

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const { data: classData, isLoading } = useClass(id!);
  const { data: classSubjects, isLoading: subjectsLoading } = useClassSubjects(id!);
  const { data: teachers = [] } = useAvailableTeachers();
  const assignTeacher = useAssignTeacher();
  const removeTeacher = useRemoveTeacher();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleAssignTeacher = async () => {
    if (!selectedTeacher) return;
    try {
      await assignTeacher.mutateAsync({ classId: id!, teacherProfileId: selectedTeacher });
      setShowTeacherModal(false);
      setSelectedTeacher('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign teacher');
    }
  };

  const handleRemoveTeacher = async () => {
    if (!confirm('Remove teacher from this class?')) return;
    try {
      await removeTeacher.mutateAsync(id!);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove teacher');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Class Details">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout title="Class Details">
        <div className="text-center py-12">
          <p className="text-gray-400">Class not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const gradeLabels: Record<number, string> = {
    0: 'Kindergarten / Pre-School',
    1: 'Grade 1',
    2: 'Grade 2',
    3: 'Grade 3',
    4: 'Grade 4',
    5: 'Grade 5',
    6: 'Grade 6',
    7: 'JHS 1 / Grade 7',
    8: 'JHS 2 / Grade 8',
    9: 'JHS 3 / Grade 9',
    10: 'SHS 1 / Grade 10',
    11: 'SHS 2 / Grade 11',
    12: 'SHS 3 / Grade 12',
  };

  return (
    <DashboardLayout title="Class Details">
      <button
        onClick={() => navigate('/classes')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-gray-500 mt-1">
              {gradeLabels[classData.gradeLevel] || `Grade ${classData.gradeLevel}`} 
              {classData.stream && ` • Stream ${classData.stream}`}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/classes/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{classData.studentCount}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-green-600" />
              <p className="text-sm text-gray-600">Class Teacher</p>
            </div>
            {classData.teacherProfile ? (
              <div>
                <p className="font-medium text-gray-900">
                  {classData.teacherProfile.user.firstName} {classData.teacherProfile.user.lastName}
                </p>
                <p className="text-xs text-gray-500">{classData.teacherProfile.user.email}</p>
              </div>
            ) : (
              <p className="text-gray-400 italic">Not assigned</p>
            )}
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Library className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-gray-600">Subjects Offered</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{classSubjects?.length || 0}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-gray-600">Created</p>
            </div>
            <p className="text-gray-900">{new Date(classData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Teacher Assignment */}
        {canManage && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {classData.teacherProfile ? (
              <button
                onClick={handleRemoveTeacher}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove Teacher
              </button>
            ) : (
              <button
                onClick={() => setShowTeacherModal(true)}
                className="flex items-center gap-2 text-sm text-[#1a3d30] hover:text-[#153328]"
              >
                <UserPlus className="w-4 h-4" />
                Assign Teacher
              </button>
            )}
          </div>
        )}
      </div>

      {/* Subjects Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#1a3d30]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-[#1a3d30]" />
              <h2 className="font-semibold text-gray-900">Subjects Offered</h2>
            </div>
            {canManage && (
              <button
                onClick={() => navigate(`/subjects/assign?classId=${id}`)}
                className="text-sm text-[#1a3d30] hover:underline"
              >
                Manage Subjects
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Subjects taught in this class and assigned teachers</p>
        </div>
        
        {subjectsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1a3d30]" />
          </div>
        ) : classSubjects && classSubjects.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {classSubjects.map((cs: any) => (
              <div key={cs.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1a3d30]/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#1a3d30]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cs.subject.name}</h3>
                        <p className="text-sm text-gray-500">Code: {cs.subject.code}</p>
                        {cs.subject.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{cs.subject.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Teachers assigned to this subject */}
                    {cs.teacherSubjects && cs.teacherSubjects.length > 0 && (
                      <div className="mt-3 ml-12">
                        <p className="text-xs font-medium text-gray-500 mb-2">Teachers:</p>
                        <div className="flex flex-wrap gap-2">
                          {cs.teacherSubjects.map((ts: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                              <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                {ts.teacher.user.firstName} {ts.teacher.user.lastName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(!cs.teacherSubjects || cs.teacherSubjects.length === 0) && (
                      <div className="mt-2 ml-12">
                        <p className="text-xs text-amber-600">No teacher assigned yet</p>
                      </div>
                    )}
                  </div>
                  
                  {canManage && (
                    <button
                      onClick={() => navigate(`/subjects/assign/${cs.subjectId}?classId=${id}`)}
                      className="text-xs text-[#1a3d30] hover:underline"
                    >
                      Assign Teacher
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No subjects assigned to this class yet</p>
            {canManage && (
              <button
                onClick={() => navigate(`/subjects/assign?classId=${id}`)}
                className="mt-4 text-sm text-[#1a3d30] hover:underline"
              >
                Add Subjects
              </button>
            )}
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Students ({classData.studentCount})</h2>
          </div>
        </div>
        
        {classData.students && classData.students.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase">Guardian</th>
                <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classData.students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/students/${student.id}`)}>
                  <td className="py-3 px-5">
                    <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                  </td>
                  <td className="py-3 px-5">
                    <span className="font-mono text-sm text-gray-600">{student.admissionNumber}</span>
                  </td>
                  <td className="py-3 px-5">
                    <p className="text-sm text-gray-600">{student.guardian?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{student.guardian?.phone || ''}</p>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {student.status.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No students in this class yet</p>
            {canManage && (
              <button
                onClick={() => navigate('/students/add')}
                className="mt-4 text-sm text-[#1a3d30] hover:underline"
              >
                Add a student
              </button>
            )}
          </div>
        )}
      </div>

      {/* Teacher Assignment Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Class Teacher</h3>
            
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-4"
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName} - {teacher.qualification || 'Teacher'}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTeacherModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTeacher}
                disabled={!selectedTeacher || assignTeacher.isPending}
                className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328] disabled:opacity-50"
              >
                {assignTeacher.isPending ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
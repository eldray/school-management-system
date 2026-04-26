import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Loader2, CheckCircle, XCircle, AlertCircle, 
  Users, GraduationCap, Award, Calendar, Eye, ChevronRight,
  Settings, Play, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useClasses } from '../../hooks/useClasses';
import { useTerms } from '../../hooks/useExams';
import api from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PromotionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [promotionResults, setPromotionResults] = useState<any>(null);
  
  const { data: classes = [] } = useClasses();
  const { data: terms = [] } = useTerms();
  
  const activeTerm = terms.find(t => t.isActive);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Criteria state
  const [criteria, setCriteria] = useState({
    minAttendance: 75,
    minAverage: 40,
    maxFailedSubjects: 2,
  });

  // Fetch students eligible for promotion
  const { data: eligibleStudents = [], isLoading } = useQuery({
    queryKey: ['promotion-eligible', selectedClass, selectedTerm],
    queryFn: async () => {
      if (!selectedClass || !selectedTerm) return [];
      const res = await api.get(`/promotions/class/${selectedClass}/term/${selectedTerm}/eligible`);
      return res.data.data;
    },
    enabled: !!selectedClass && !!selectedTerm,
  });

  // Promote class mutation
  const promoteClassMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/promotions/class/${selectedClass}/term/${selectedTerm}`, criteria);
      return res.data.data;
    },
    onSuccess: (data) => {
      setPromotionResults(data);
      setShowConfirmModal(false);
      queryClient.invalidateQueries({ queryKey: ['promotion-eligible'] });
    },
  });

  // Promote all classes mutation
  const promoteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/promotions/all/term/${selectedTerm || activeTerm?.id}`, criteria);
      return res.data.data;
    },
    onSuccess: (data) => {
      setPromotionResults(data);
      setShowConfirmModal(false);
    },
  });

  const handlePromoteClass = () => {
    if (!selectedClass || !selectedTerm) {
      alert('Please select a class and term');
      return;
    }
    setShowConfirmModal(true);
  };

  const handlePromoteAll = () => {
    if (!selectedTerm && !activeTerm) {
      alert('Please select a term');
      return;
    }
    setShowConfirmModal(true);
  };

  if (!isAdmin) {
    return (
      <DashboardLayout title="Student Promotion">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Access Denied</h3>
          <p className="text-gray-500">Only administrators can manage student promotions.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Promotion">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Promotion</h2>
            <p className="text-gray-500 text-sm mt-1">
              Review and promote students to the next class
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCriteriaModal(true)}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Promotion Criteria
            </button>
            <button
              onClick={handlePromoteAll}
              disabled={promoteAllMutation.isPending}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
            >
              {promoteAllMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Promote All Classes
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">End of Academic Year Promotion</p>
              <p className="text-sm text-blue-700 mt-1">
                This process should be done after the third term examinations are completed and results are finalized.
                Students will be evaluated based on attendance, average score, and failed subjects.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} (Grade {cls.gradeLevel})</option>
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
                <option value="">Select a term</option>
                {terms.filter(t => t.type === 'THIRD_TERM').map(term => (
                  <option key={term.id} value={term.id}>{term.name} {term.isActive && '(Active)'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Promotion Results */}
        {promotionResults && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Promotion Completed</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total Students" value={promotionResults.totalStudents} color="blue" />
              <StatCard label="Promoted" value={promotionResults.promoted} color="green" />
              <StatCard label="Repeated" value={promotionResults.repeated} color="amber" />
              <StatCard label="From → To" value={`${promotionResults.fromClass} → ${promotionResults.toClass}`} color="purple" />
            </div>
            <button
              onClick={() => setPromotionResults(null)}
              className="mt-4 text-sm text-green-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Eligible Students Table */}
        {selectedClass && selectedTerm && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Students Eligible for Promotion</h3>
              <button
                onClick={handlePromoteClass}
                disabled={promoteClassMutation.isPending || eligibleStudents?.length === 0}
                className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
              >
                {promoteClassMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                Promote This Class
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
              </div>
            ) : eligibleStudents?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No students found or all students have already been processed.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Average</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Passed/Failed</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eligibleStudents?.map((student: any) => {
                    const meetsAttendance = student.attendancePercentage >= criteria.minAttendance;
                    const meetsAcademic = student.averageScore >= criteria.minAverage && 
                                         student.failedSubjects <= criteria.maxFailedSubjects;
                    const shouldPromote = meetsAttendance && meetsAcademic;

                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{student.firstName} {student.lastName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{student.admissionNumber}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={meetsAttendance ? 'text-green-600' : 'text-red-600'}>
                            {student.attendancePercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={student.averageScore >= criteria.minAverage ? 'text-green-600' : 'text-red-600'}>
                            {student.averageScore.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={student.failedSubjects <= criteria.maxFailedSubjects ? 'text-green-600' : 'text-red-600'}>
                            {student.passedSubjects}/{student.subjectsTaken}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {shouldPromote ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              <CheckCircle className="w-3 h-3" /> Promote
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                              <AlertCircle className="w-3 h-3" /> Review
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/students/${student.id}`)}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                              title="View Student"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!shouldPromote && (
                              <button
                                onClick={() => {/* Open manual override modal */}}
                                className="p-1.5 hover:bg-amber-50 rounded text-amber-600"
                                title="Manual Override"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Promotion Criteria Modal */}
        {showCriteriaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Promotion Criteria</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Attendance (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={criteria.minAttendance}
                    onChange={(e) => setCriteria({ ...criteria, minAttendance: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Average Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={criteria.minAverage}
                    onChange={(e) => setCriteria({ ...criteria, minAverage: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Failed Subjects
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={criteria.maxFailedSubjects}
                    onChange={(e) => setCriteria({ ...criteria, maxFailedSubjects: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCriteriaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCriteriaModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328]"
                >
                  Save Criteria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Promotion</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to promote students? This action will move students to the next class and cannot be automatically undone.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Students who don't meet the criteria will be marked for repetition.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedClass === 'ALL') {
                      promoteAllMutation.mutate();
                    } else {
                      promoteClassMutation.mutate();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328]"
                >
                  Yes, Promote
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-75">{label}</p>
    </div>
  );
}
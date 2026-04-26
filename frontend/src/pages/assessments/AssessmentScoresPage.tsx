import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Search, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';

export default function AssessmentScoresPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [scores, setScores] = useState<Record<string, { marks: string; remarks: string }>>({});
  const [saving, setSaving] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const { data: teacherClassesData } = useTeacherAccessibleClasses();

  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment-scores', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/assessments/${id}/scores`);
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 403) {
          setPermissionError(err.response?.data?.message || 'You do not have permission to view/edit scores for this assessment');
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  const assessment = data?.assessment;
  const students = data?.students || [];

  const saveMutation = useMutation({
    mutationFn: async (scoresData: any[]) => {
      const res = await api.post(`/assessments/${id}/scores`, { scores: scoresData });
      return res.data.data;
    },
    onSuccess: () => {
      alert('Scores saved successfully!');
      navigate('/assessments');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        setPermissionError(error.response?.data?.message || 'You do not have permission to save scores');
      } else {
        alert(error.response?.data?.message || 'Failed to save scores');
      }
    },
  });

  // Check if teacher has permission to enter scores for this assessment
  const canEnterScores = isAdmin || (isTeacher && teacherClassesData && assessment && (
    teacherClassesData.some((c: any) => c.id === assessment.classId && c.canEnterResults === true)
  ));

  useEffect(() => {
    if (students.length > 0) {
      const initial: Record<string, { marks: string; remarks: string }> = {};
      students.forEach((student: any) => {
        const existingScore = student.assessmentScores?.[0];
        initial[student.id] = {
          marks: existingScore?.marksObtained?.toString() || '',
          remarks: existingScore?.remarks || '',
        };
      });
      setScores(initial);
    }
  }, [students]);

  const filteredStudents = students.filter((s: any) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()
  ));

  const handleScoreChange = (studentId: string, value: string) => {
    if (!canEnterScores) return;
    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: value },
    }));
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    if (!canEnterScores) return;
    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks: value },
    }));
  };

  const handleSaveAll = async () => {
    if (!canEnterScores) {
      alert('You do not have permission to save scores');
      return;
    }

    const scoresData = Object.entries(scores)
      .filter(([_, data]) => data.marks)
      .map(([studentId, data]) => ({
        studentId,
        marksObtained: parseFloat(data.marks),
        remarks: data.remarks,
      }));

    if (scoresData.length === 0) {
      alert('Please enter at least one score');
      return;
    }

    setSaving(true);
    try {
      await saveMutation.mutateAsync(scoresData);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setSaving(false);
    }
  };

  // Show permission error
  if (permissionError) {
    return (
      <DashboardLayout title="Enter Scores">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-700 mb-4">{permissionError}</p>
          <p className="text-red-600 text-sm mb-6">
            Only Class Teachers and Subject Teachers can enter scores for assessments in their classes/subjects.
          </p>
          <button
            onClick={() => navigate('/assessments')}
            className="px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Assessments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Show no permission message for teachers who can't enter scores
  if (isTeacher && !canEnterScores && !isLoading && assessment) {
    return (
      <DashboardLayout title="Enter Scores">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cannot Enter Scores</h3>
          <p className="text-yellow-700 mb-4">
            You don't have permission to enter scores for this assessment.
          </p>
          <p className="text-yellow-600 text-sm">
            Only the Class Teacher of {assessment.class?.name} or Subject Teachers teaching {assessment.subject?.name} can enter scores.
          </p>
          <button
            onClick={() => navigate('/assessments')}
            className="mt-4 px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Assessments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Enter Scores">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Enter Scores">
      <button onClick={() => navigate('/assessments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Assessments
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] px-5 py-4 text-white">
          <h2 className="text-lg font-bold">{assessment?.name}</h2>
          <p className="text-white/70 text-sm">
            {assessment?.subject?.name} • {assessment?.class?.name} • Total: {assessment?.totalMarks} marks
          </p>
          {isTeacher && (
            <p className="text-white/50 text-xs mt-1">
              {assessment?.classTeacher ? 'You are the Class Teacher' : 'You are teaching this subject'}
            </p>
          )}
        </div>

        <div className="p-4 border-b border-gray-200">
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
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No students match your search' : 'No students in this class'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                  <th className="text-center py-3 px-5 text-xs font-medium text-gray-500 uppercase w-32">Marks</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="py-3 px-5 font-medium">{student.firstName} {student.lastName}</td>
                    <td className="py-3 px-5 text-sm text-gray-600">{student.admissionNumber}</td>
                    <td className="py-3 px-5">
                      <input
                        type="number"
                        min="0"
                        max={assessment?.totalMarks}
                        step="0.5"
                        value={scores[student.id]?.marks || ''}
                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        disabled={!canEnterScores}
                        className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                        placeholder="-"
                      />
                    </td>
                    <td className="py-3 px-5">
                      <input
                        type="text"
                        value={scores[student.id]?.remarks || ''}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        disabled={!canEnterScores}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-100"
                        placeholder="Optional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {canEnterScores && (
          <div className="p-5 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save All Scores</>}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Search, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useRecordResult, useExam } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useQuery } from '@tanstack/react-query';

export default function ResultsEntryPage() {
  const { examId, subjectId } = useParams<{ examId: string; subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Record<string, { marks: string; isAbsent: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const { data: exam, isLoading: examLoading } = useExam(examId!);
  const examSubject = exam?.examSubjects?.find(s => s.id === subjectId);
  
  const { data: students = [], isLoading: studentsLoading, error: fetchError } = useQuery({
    queryKey: ['exam-subject-results', subjectId],
    queryFn: async () => {
      try {
        const res = await api.get(`/exams/exam-subjects/${subjectId}/results`);
        return res.data.data.students || [];
      } catch (error: any) {
        if (error.response?.status === 403) {
          setPermissionError(error.response?.data?.message || 'You do not have permission to enter results for this exam');
        }
        throw error;
      }
    },
    enabled: !!subjectId,
  });

  const recordResult = useRecordResult();

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (students.length > 0) {
      const initial: Record<string, { marks: string; isAbsent: boolean }> = {};
      students.forEach((student: any) => {
        const existingResult = student.examResults?.[0];
        initial[student.id] = {
          marks: existingResult?.marksObtained?.toString() || '',
          isAbsent: existingResult?.isAbsent || false,
        };
      });
      setResults(initial);
    }
  }, [students]);

  const filteredStudents = students.filter((s: any) => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkChange = (studentId: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: value, isAbsent: false },
    }));
  };

  const handleAbsentChange = (studentId: string, isAbsent: boolean) => {
    setResults(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], isAbsent, marks: isAbsent ? '' : prev[studentId]?.marks || '' },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setPermissionError(null);
    
    try {
      const promises = Object.entries(results).map(([studentId, data]) => {
        if (data.isAbsent) {
          // Mark as absent with 0 marks
          return recordResult.mutateAsync({
            examSubjectId: subjectId!,
            studentId,
            marksObtained: 0,
          });
        }
        if (!data.marks) return Promise.resolve();
        return recordResult.mutateAsync({
          examSubjectId: subjectId!,
          studentId,
          marksObtained: parseFloat(data.marks),
        });
      });
      
      await Promise.all(promises);
      alert('Results saved successfully!');
      navigate(`/exams/${examId}`);
    } catch (error: any) {
      console.error('Save error:', error);
      if (error.response?.status === 403) {
        setPermissionError(error.response?.data?.message || 'You do not have permission to enter results');
      } else {
        alert(error.response?.data?.message || 'Failed to save some results');
      }
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (examLoading || studentsLoading) {
    return (
      <DashboardLayout title="Enter Results">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show permission error
  if (permissionError || fetchError) {
    return (
      <DashboardLayout title="Enter Results">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-700 mb-4">
            {permissionError || 'You do not have permission to enter results for this exam.'}
          </p>
          <p className="text-red-600 text-sm mb-6">
            Only Class Teachers and Subject Teachers can enter results for their respective classes/subjects.
          </p>
          <button
            onClick={() => navigate(`/exams/${examId}`)}
            className="px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Exam
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Enter Results">
      <button onClick={() => navigate(`/exams/${examId}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Exam
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] px-5 py-4 text-white">
          <h2 className="text-lg font-bold">{examSubject?.subject?.name}</h2>
          <p className="text-white/70 text-sm">
            {examSubject?.class?.name} • Total: {examSubject?.totalMarks} marks • {students.length} students
          </p>
          {isTeacher && (
            <p className="text-white/50 text-xs mt-1">
              {examSubject?.classTeacher ? 'You are the Class Teacher' : 'You are teaching this subject'}
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
                  <th className="text-center py-3 px-5 text-xs font-medium text-gray-500 uppercase w-24">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student: any) => {
                  const currentMarks = results[student.id]?.marks || '';
                  const isAbsent = results[student.id]?.isAbsent || false;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="py-3 px-5">
                        <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-mono text-sm text-gray-600">{student.admissionNumber || '—'}</span>
                      </td>
                      <td className="py-3 px-5">
                        <input
                          type="number"
                          min="0"
                          max={examSubject?.totalMarks}
                          step="0.5"
                          value={currentMarks}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          disabled={isAbsent}
                          className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-3 px-5 text-center">
                        <input
                          type="checkbox"
                          checked={isAbsent}
                          onChange={(e) => handleAbsentChange(student.id, e.target.checked)}
                          className="w-4 h-4 text-[#1a3d30] rounded"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={saving || filteredStudents.length === 0}
            className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save All Results</>}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
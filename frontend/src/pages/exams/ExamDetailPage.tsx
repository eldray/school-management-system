import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, BookOpen, CheckCircle, Loader2, Printer, Users, ChevronDown, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useExam, usePublishExam } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const { data: exam, isLoading: loadingExam } = useExam(id!);
  const publishExam = usePublishExam();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canEnterResults = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER';

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loadingExam) {
    return (
      <DashboardLayout title="Exam Details">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout title="Exam Details">
        <div className="text-center py-12">
          <p className="text-gray-400">Exam not found</p>
        </div>
      </DashboardLayout>
    );
  }

  // Group exam subjects by class
  const subjectsByClass = exam.examSubjects?.reduce((acc, subject) => {
    const className = subject.class?.name || 'Unknown Class';
    if (!acc[className]) acc[className] = [];
    acc[className].push(subject);
    return acc;
  }, {} as Record<string, typeof exam.examSubjects>) || {};

  const totalSubjects = exam.examSubjects?.length || 0;
  const totalResults = exam.examSubjects?.reduce((sum, s) => sum + (s._count?.results || 0), 0) || 0;

  return (
    <DashboardLayout title="Exam Details">
      <button onClick={() => navigate('/exams')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Exams
      </button>

      {/* Exam Header - Compact */}
      <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] rounded-xl p-5 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{exam.name}</h1>
            <p className="text-white/70 text-sm mt-0.5">{exam.term?.name} • {exam.academicYear}</p>
          </div>
          <div className="flex items-center gap-2">
            {!exam.isPublished && canManage && (
              <button
                onClick={() => publishExam.mutate(id!)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Publish
              </button>
            )}
            <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-white/60 text-xs">Period</p>
            <p className="font-medium text-sm">{formatDate(exam.startDate)} - {formatDate(exam.endDate)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-white/60 text-xs">Subjects</p>
            <p className="font-medium text-sm">{totalSubjects} papers</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-white/60 text-xs">Results</p>
            <p className="font-medium text-sm">{totalResults} entered</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-white/60 text-xs">Status</p>
            <p className="font-medium text-sm">{exam.isPublished ? '✅ Published' : '📝 Draft'}</p>
          </div>
        </div>
      </div>

      {/* Subjects by Class */}
      <div className="space-y-4">
        {Object.entries(subjectsByClass).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No subjects added to this exam yet</p>
          </div>
        ) : (
          Object.entries(subjectsByClass).map(([className, subjects]) => (
            <div key={className} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpandedClass(expandedClass === className ? null : className)}
                className="w-full bg-gray-50 px-5 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{className} ({subjects.length} subjects)</h3>
                {expandedClass === className ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              {expandedClass === className && (
                <div className="divide-y divide-gray-100">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-[#1a3d30]" />
                        <div>
                          <p className="font-medium text-gray-900">{subject.subject?.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(subject.examDate)} {subject.startTime && `• ${subject.startTime}`} {subject.duration && `• ${subject.duration} mins`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total: {subject.totalMarks} marks</p>
                          <p className="text-xs text-gray-400">{subject._count?.results || 0} results entered</p>
                        </div>
                        {canEnterResults && !exam.isPublished && (
                          <button
                            onClick={() => navigate(`/exams/${id}/subjects/${subject.id}/results`)}
                            className="px-3 py-1.5 bg-[#1a3d30] text-white rounded-lg text-xs hover:bg-[#153328]"
                          >
                            Enter Results
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
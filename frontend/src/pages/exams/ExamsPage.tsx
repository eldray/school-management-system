import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, BookOpen, CheckCircle, Loader2, Star, Clock, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useExams, useTerms, useTeacherExamOptions } from '../../hooks/useExams';

const examTypeLabels: Record<string, string> = {
  MID_TERM: 'Mid-Term',
  END_OF_TERM: 'End of Term',
  MOCK: 'Mock Exam',
  FINAL: 'Final Exam',
};

const examTypeColors: Record<string, string> = {
  MID_TERM: 'bg-green-100 text-green-700',
  END_OF_TERM: 'bg-blue-100 text-blue-700',
  MOCK: 'bg-purple-100 text-purple-700',
  FINAL: 'bg-red-100 text-red-700',
};

export default function ExamsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [termFilter, setTermFilter] = useState('ALL');
  
  const { data: exams = [], isLoading } = useExams();
  const { data: terms = [] } = useTerms();
  const { data: teacherOptions } = useTeacherExamOptions();
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  // Check if teacher has permissions to create exams
  const canCreateExams = isAdmin || (isTeacher && teacherOptions?.canCreateExams === true);
  const isUnassignedTeacher = isTeacher && teacherOptions?.isUnassigned === true;
  
  const activeTerm = terms.find(t => t.isActive);

  // Filter exams based on teacher's accessible classes/subjects
  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.class?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTerm = termFilter === 'ALL' || exam.termId === termFilter;
    
    // For teachers, only show exams from their classes/subjects
    if (isTeacher && teacherOptions) {
      const isClassTeacherClass = teacherOptions.classTeacherClasses?.some((c: any) => c.id === exam.classId);
      const isSubjectTeacherClass = teacherOptions.subjectTeacherOptions?.some((s: any) => s.classId === exam.classId);
      return matchesSearch && matchesTerm && (isClassTeacherClass || isSubjectTeacherClass);
    }
    
    return matchesSearch && matchesTerm;
  });

  return (
    <DashboardLayout title="Exams">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Examinations</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage exams, timetables, and results
            </p>
          </div>
          <div className="flex gap-2">
            {canCreateExams && (
              <button
                onClick={() => navigate('/exams/add')}
                className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </button>
            )}
          </div>
        </div>

        {/* Unassigned Teacher Warning */}
        {isUnassignedTeacher && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">No Class or Subject Assignment</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You are not assigned to any class as a Class Teacher or Subject Teacher. 
                  You can view all class names but cannot create exams or enter results.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Contact the administrator to get assignments. Once assigned, you'll be able to create exams for your classes/subjects.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Term Banner */}
        {activeTerm && (
          <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 fill-white" />
              <div>
                <p className="font-medium">Current Term: {activeTerm.name}</p>
                <p className="text-sm text-white/70">
                  {new Date(activeTerm.startDate).toLocaleDateString()} - {new Date(activeTerm.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by exam, subject, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="ALL">All Terms</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => navigate(`/exams/${exam.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exam.subject?.name || exam.name}</h3>
                    <p className="text-sm text-gray-500">{exam.class?.name}</p>
                  </div>
                  {exam.isPublished ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                      Draft
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(exam.startDate || exam.examDate).toLocaleDateString()}</span>
                  </div>
                  {exam.startTime && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{exam.startTime} {exam.duration && `• ${exam.duration} mins`}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{exam.term?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${examTypeColors[exam.type]}`}>
                      {examTypeLabels[exam.type]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {exam._count?.results || 0} results
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredExams.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No exams found</p>
            {canCreateExams && (
              <button
                onClick={() => navigate('/exams/add')}
                className="mt-4 text-sm text-[#1a3d30] hover:underline"
              >
                Create your first exam
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
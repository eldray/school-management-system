import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, ClipboardList, TrendingUp, Award, BookOpen, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useClasses } from '../../hooks/useClasses';
import { useTerms } from '../../hooks/useExams';
import { useSubjects } from '../../hooks/useExams';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

const assessmentTypeColors: Record<string, string> = {
  'Class Test': 'bg-blue-100 text-blue-700',
  'Quiz': 'bg-green-100 text-green-700',
  'Project': 'bg-purple-100 text-purple-700',
  'Homework': 'bg-orange-100 text-orange-700',
};

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const { data: allClasses = [] } = useClasses();
  const { data: terms = [] } = useTerms();
  const { data: allSubjects = [] } = useSubjects();
  const { data: teacherClassesData, isLoading: teacherClassesLoading } = useTeacherAccessibleClasses();
  
  const activeTerm = terms.find(t => t.isActive);
  
  // Filter classes and subjects based on teacher permissions
  let availableClasses: any[] = [];
  let availableSubjects: any[] = [];
  let canCreateAssessment = false;
  
  if (isAdmin) {
    availableClasses = allClasses;
    availableSubjects = allSubjects;
    canCreateAssessment = true;
  } else if (isTeacher && teacherClassesData) {
    // Classes where teacher can create assessments (Class Teacher can create for all subjects, Subject Teacher only for their subjects)
    availableClasses = teacherClassesData.filter((c: any) => c.canEnterResults === true);
    // Subjects the teacher teaches
    const teacherSubjectIds = new Set();
    teacherClassesData.forEach((c: any) => {
      if (c.subjects) {
        c.subjects.forEach((s: any) => teacherSubjectIds.add(s.id));
      }
    });
    availableSubjects = allSubjects.filter((s: any) => teacherSubjectIds.has(s.id));
    canCreateAssessment = teacherClassesData.some((c: any) => c.canEnterResults === true);
  }

  // Fetch assessments - filter by teacher's accessible classes if teacher
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments', selectedClass, selectedTerm, selectedSubject, user?.role, teacherClassesData],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedTerm) params.append('termId', selectedTerm);
      if (selectedSubject) params.append('subjectId', selectedSubject);
      const res = await api.get(`/assessments?${params.toString()}`);
      let data = res.data.data;
      
      // For teachers, filter assessments to only those they have access to
      if (isTeacher && teacherClassesData) {
        const accessibleClassIds = teacherClassesData.filter((c: any) => c.canViewStudents === true).map((c: any) => c.id);
        data = data.filter((a: any) => accessibleClassIds.includes(a.classId));
      }
      
      return data;
    },
  });

  // Fetch assessment types for summary
  const { data: assessmentTypes = [] } = useQuery({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const res = await api.get('/assessments/types');
      return res.data.data;
    },
  });

  // Calculate summary stats (only for visible assessments)
  const getTypeCount = (typeName: string) => {
    return assessments.filter((a: any) => a.type?.name === typeName).length;
  };

  const getTypeWeight = (typeName: string) => {
    const type = assessmentTypes.find((t: any) => t.name === typeName);
    return type?.weight || 0;
  };

  // Filter assessments by search
  const filteredAssessments = assessments.filter((a: any) => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  if (isTeacher && teacherClassesLoading) {
    return (
      <DashboardLayout title="Continuous Assessment">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show message for teachers with no access
  if (isTeacher && (!teacherClassesData || teacherClassesData.length === 0 || !canCreateAssessment)) {
    return (
      <DashboardLayout title="Continuous Assessment">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Limited Access</h3>
          <p className="text-yellow-700 mb-4">
            You can view assessments for classes you are assigned to, but cannot create new assessments.
          </p>
          <p className="text-yellow-600 text-sm">
            To create assessments, you need to be a Class Teacher. Subject Teachers can only enter scores for existing assessments.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Continuous Assessment">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Continuous Assessment</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage class tests, quizzes, projects, and homework
            </p>
          </div>
          {canCreateAssessment && (
            <button
              onClick={() => navigate('/assessments/add')}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Plus className="w-4 h-4" />
              Create Assessment
            </button>
          )}
        </div>

        {/* Info Banner for Teachers */}
        {isTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              You can enter scores for assessments in classes you are assigned to as Class Teacher or Subject Teacher.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Classes</option>
                {availableClasses.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.accessType === 'CLASS_TEACHER' && '(Class Teacher)'}
                    {cls.accessType === 'SUBJECT_TEACHER' && '(Subject Teacher)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Terms</option>
                {terms.map((term: any) => (
                  <option key={term.id} value={term.id}>
                    {term.name} {term.isActive && '(Active)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Subjects</option>
                {availableSubjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Types Summary */}
        <div className="grid grid-cols-4 gap-4">
          {assessmentTypes.map((type: any) => {
            const icons: Record<string, any> = {
              'Class Test': ClipboardList,
              'Quiz': Award,
              'Project': BookOpen,
              'Homework': TrendingUp,
            };
            const Icon = icons[type.name] || ClipboardList;
            const colors: Record<string, string> = {
              'Class Test': 'text-blue-600',
              'Quiz': 'text-green-600',
              'Project': 'text-purple-600',
              'Homework': 'text-orange-600',
            };
            
            return (
              <div key={type.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${colors[type.name] || 'text-gray-600'}`} />
                  <span className="text-sm font-medium">{type.name}s</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{getTypeCount(type.name)}</p>
                <p className="text-xs text-gray-500">Weight: {type.weight}%</p>
              </div>
            );
          })}
        </div>

        {/* Assessments List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Assessments 
              {filteredAssessments.length > 0 && (
                <span className="ml-2 text-sm text-gray-500">({filteredAssessments.length})</span>
              )}
            </h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              {assessments.length === 0 
                ? 'No assessments created yet'
                : 'No assessments match your filters'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Assessment</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Marks</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssessments.map((assessment: any) => {
                  const scoresEntered = assessment._count?.scores || 0;
                  const classStudents = assessment.class?._count?.students || 25;
                  
                  return (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{assessment.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assessmentTypeColors[assessment.type?.name] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {assessment.type?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{assessment.class?.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{assessment.subject?.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(assessment.date)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{assessment.totalMarks} marks</td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => navigate(`/assessments/${assessment.id}/scores`)}
                          className="text-sm text-[#1a3d30] hover:underline"
                        >
                          Enter Scores ({scoresEntered}/{classStudents})
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, ClipboardList, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useClasses } from '../../hooks/useClasses';
import { useTerms } from '../../hooks/useExams';
import { useSubjects } from '../../hooks/useExams';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';
import api from '../../lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';

const assessmentTypeOptions = [
  { value: 'Class Test', label: '📝 Class Test' },
  { value: 'Quiz', label: '🎯 Quiz' },
  { value: 'Project', label: '📊 Project' },
  { value: 'Homework', label: '📚 Homework' },
];

export default function AddAssessmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const { data: allClasses = [] } = useClasses();
  const { data: terms = [] } = useTerms();
  const { data: allSubjects = [] } = useSubjects();
  const { data: teacherClassesData, isLoading: teacherClassesLoading } = useTeacherAccessibleClasses();
  
  const activeTerm = terms.find(t => t.isActive);
  
  // Determine which classes the teacher can create assessments for
  let availableClasses: any[] = [];
  let canCreateAssessment = false;
  
  if (isAdmin) {
    availableClasses = allClasses;
    canCreateAssessment = true;
  } else if (isTeacher && teacherClassesData) {
    // Only Class Teachers can create assessments (full access to all subjects in their class)
    availableClasses = teacherClassesData.filter((c: any) => c.accessType === 'CLASS_TEACHER');
    canCreateAssessment = availableClasses.length > 0;
  }
  
  const [form, setForm] = useState({
    type: 'Quiz',
    subjectId: '',
    classId: '',
    termId: activeTerm?.id || '',
    name: '',
    totalMarks: 20,
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch assessment types from backend
  const { data: assessmentTypes = [] } = useQuery({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const res = await api.get('/assessments/types');
      return res.data.data;
    },
  });

  // Get subjects for selected class (if teacher is class teacher, they can choose any subject)
  const getAvailableSubjectsForClass = (classId: string) => {
    if (!classId) return [];
    if (isAdmin) return allSubjects;
    
    // For class teachers, they can add any subject that belongs to their class
    const classData = availableClasses.find(c => c.id === classId);
    if (classData?.subjects) return classData.subjects;
    
    return allSubjects;
  };

  const availableSubjects = getAvailableSubjectsForClass(form.classId);

  const createAssessment = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/assessments', data);
      return res.data.data;
    },
    onSuccess: () => {
      alert('Assessment created successfully!');
      navigate('/assessments');
    },
    onError: (error: any) => {
      console.error('Create assessment error:', error);
      alert(error.response?.data?.message || 'Failed to create assessment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.subjectId) {
      alert('Please select a subject');
      return;
    }
    if (!form.classId) {
      alert('Please select a class');
      return;
    }
    if (!form.name) {
      alert('Please enter an assessment name');
      return;
    }
    
    createAssessment.mutate(form);
  };

  // Show loading
  if (isTeacher && teacherClassesLoading) {
    return (
      <DashboardLayout title="Create Assessment">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show permission denied for teachers who can't create assessments
  if (isTeacher && !canCreateAssessment) {
    return (
      <DashboardLayout title="Create Assessment">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cannot Create Assessment</h3>
          <p className="text-yellow-700 mb-4">
            Only Class Teachers can create assessments.
          </p>
          <p className="text-yellow-600 text-sm">
            You are not assigned as a Class Teacher for any class. 
            Subject Teachers can only enter scores for existing assessments.
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

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  // Use backend types if available, otherwise fallback to default options
  const typeOptions = assessmentTypes.length > 0 
    ? assessmentTypes.map((t: any) => ({ value: t.name, label: `${t.name} (${t.weight}%)` }))
    : assessmentTypeOptions;

  return (
    <DashboardLayout title="Create Assessment">
      <button onClick={() => navigate('/assessments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Assessments
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Assessment</h2>
            <p className="text-gray-500 text-sm">
              {isAdmin ? 'Set up a class test, quiz, project, or homework' : 'Create an assessment for your class'}
            </p>
          </div>
        </div>

        {isTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              As a Class Teacher, you can create assessments for all subjects in your class.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Assessment Type</label>
            <select 
              value={form.type} 
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={inputCls}
            >
              {typeOptions.map((type: any) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Assessment Name *</label>
            <input 
              type="text" 
              placeholder="e.g., Quiz 1 - Fractions" 
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Class *</label>
              <select 
                value={form.classId} 
                onChange={(e) => {
                  setForm({ ...form, classId: e.target.value, subjectId: '' });
                }}
                className={inputCls} 
                required
              >
                <option value="">Select Class</option>
                {availableClasses.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.accessType === 'CLASS_TEACHER' && ' (Your Class)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject *</label>
              <select 
                value={form.subjectId} 
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={inputCls} 
                required
              >
                <option value="">Select Subject</option>
                {availableSubjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Term *</label>
              <select 
                value={form.termId} 
                onChange={(e) => setForm({ ...form, termId: e.target.value })}
                className={inputCls} 
                required
              >
                {terms.map((term: any) => (
                  <option key={term.id} value={term.id}>
                    {term.name} {term.isActive && '(Active)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Total Marks</label>
              <input 
                type="number" 
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) || 20 })}
                className={inputCls} 
                min="1"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Date *</label>
            <input 
              type="date" 
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputCls} 
              required 
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => navigate('/assessments')} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createAssessment.isPending} 
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
            >
              {createAssessment.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
              ) : (
                <><Save className="w-4 h-4" />Create Assessment</>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
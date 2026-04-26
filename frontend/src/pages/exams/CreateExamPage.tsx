import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, X, BookOpen, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCreateExam, useTerms, useSubjects, useTeacherExamOptions } from '../../hooks/useExams';
import { useClasses } from '../../hooks/useClasses';
import { useAuth } from '../../context/AuthContext';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';

const examTypeLabels: Record<string, string> = {
  MID_TERM: 'Mid-Term Exams',
  END_OF_TERM: 'End of Term Exams',
  MOCK: 'Mock Exams',
  FINAL: 'Final Exams',
};

const sessionOptions = [
  { value: 'MORNING', label: '🌅 Morning (8:00 AM - 12:00 PM)' },
  { value: 'AFTERNOON', label: '☀️ Afternoon (1:00 PM - 5:00 PM)' },
];

const sessionDefaultTimes: Record<string, string> = {
  MORNING: '08:00',
  AFTERNOON: '13:00',
};

export default function CreateExamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: terms = [] } = useTerms();
  const { data: allClasses = [] } = useClasses();
  const { data: allSubjects = [] } = useSubjects();
  const { data: teacherOptions, isLoading: teacherOptionsLoading } = useTeacherExamOptions();
  const { data: settings } = useSchoolSettings();
  const createExam = useCreateExam();

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  // Check if teacher has permissions
  const canCreateExams = isAdmin || (isTeacher && teacherOptions?.canCreateExams === true);
  const isUnassignedTeacher = isTeacher && teacherOptions?.isUnassigned === true;
  
  const activeTerm = terms.find(t => t.isActive);

  // Get enabled exam types from settings
  const enabledExamTypes = settings?.enabledExamTypes || {
    MID_TERM: true,
    END_OF_TERM: true,
    MOCK: true,
    FINAL: true,
  };
  
  const availableExamTypes = Object.entries(enabledExamTypes)
    .filter(([, enabled]) => enabled)
    .map(([value]) => ({ value, label: examTypeLabels[value] || value }));

  // Get user's accessible classes (with permissions)
  const userClasses = useMemo(() => {
    if (isAdmin) return allClasses;
    if (isTeacher && teacherOptions) {
      // Combine class teacher classes and subject teacher classes
      const classTeacherClasses = teacherOptions.classTeacherClasses || [];
      const subjectTeacherClasses = teacherOptions.subjectTeacherOptions?.map(s => ({
        id: s.classId,
        name: s.className,
        accessType: 'SUBJECT_TEACHER'
      })) || [];
      
      // Merge and deduplicate
      const merged = [...classTeacherClasses, ...subjectTeacherClasses];
      const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      return unique;
    }
    return [];
  }, [isAdmin, isTeacher, allClasses, teacherOptions]);

  const [step, setStep] = useState<'details' | 'subjects'>('details');
  const [form, setForm] = useState({
    name: '',
    type: availableExamTypes[0]?.value || 'MID_TERM',
    termId: activeTerm?.id || '',
    academicYear: activeTerm?.academicYear || '',
    startDate: '',
    endDate: '',
  });

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<{
    subjectId: string;
    examDate: string;
    startTime: string;
    duration: number;
    totalMarks: number;
    session: string;
  }[]>([]);

  // Auto-generate exam name
  const generatedExamName = useMemo(() => {
    if (form.type && activeTerm) {
      const typeLabel = examTypeLabels[form.type] || form.type;
      return `${typeLabel} - ${activeTerm.name}`;
    }
    return '';
  }, [form.type, activeTerm]);

  // Set active term and default marks/duration from settings
  useEffect(() => {
    if (activeTerm && !form.termId) {
      setForm(prev => ({
        ...prev,
        termId: activeTerm.id,
        academicYear: activeTerm.academicYear,
      }));
    }
  }, [activeTerm]);

  // Auto-select class if teacher has only one
  useEffect(() => {
    if (isTeacher && userClasses.length === 1 && !selectedClass) {
      setSelectedClass(userClasses[0].id);
    }
  }, [isTeacher, userClasses]);

  // Redirect if teacher can't create exams
  if (isTeacher && !canCreateExams && !teacherOptionsLoading) {
    return (
      <DashboardLayout title="Create Exam">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cannot Create Exams</h3>
          <p className="text-yellow-700 mb-4">
            {isUnassignedTeacher 
              ? "You are not assigned to any class. Please contact the administrator to get class or subject assignments."
              : "You don't have permission to create exams. Only Class Teachers can create exams."}
          </p>
          <button
            onClick={() => navigate('/exams')}
            className="mt-2 px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Exams
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getAvailableSubjectsForClass = (classId: string) => {
    if (!classId) return [];
    if (isAdmin) return allSubjects;
    if (!teacherOptions) return [];
    
    // Check if user is class teacher for this class
    const isClassTeacher = teacherOptions.classTeacherClasses?.some((c: any) => c.id === classId);
    if (isClassTeacher) {
      // Class teacher can add ALL subjects for their class
      const classSubjects = teacherOptions.classTeacherClasses?.find((c: any) => c.id === classId)?.subjects || [];
      return classSubjects;
    }
    
    // Subject teacher can only add subjects they teach
    return teacherOptions.subjectTeacherOptions
      ?.filter((s: any) => s.classId === classId)
      .map((s: any) => ({ id: s.subjectId, name: s.subjectName, code: s.subjectCode })) || [];
  };

  const currentAvailableSubjects = getAvailableSubjectsForClass(selectedClass);
  const isClassTeacherForSelected = isTeacher && teacherOptions?.classTeacherClasses?.some((c: any) => c.id === selectedClass);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }
    setStep('subjects');
  };

  const addSubject = () => {
    if (!selectedClass) {
      alert('Please select a class first');
      return;
    }
    
    const availableSubjects = getAvailableSubjectsForClass(selectedClass);
    if (availableSubjects.length === 0) {
      alert(isClassTeacherForSelected 
        ? 'No subjects configured for this class. Please add subjects to this class first.'
        : 'You are not assigned to teach any subject in this class.');
      return;
    }
    
    setSelectedSubjects([
      ...selectedSubjects,
      { 
        subjectId: '', 
        examDate: form.startDate, 
        startTime: '09:00', 
        duration: settings?.defaultExamDuration || 60, 
        totalMarks: settings?.defaultTotalMarks || 100,
        session: 'MORNING',
      },
    ]);
  };

  const removeSubject = (index: number) => {
    setSelectedSubjects(selectedSubjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: any) => {
    const updated = [...selectedSubjects];
    
    if (field === 'session') {
      updated[index] = { 
        ...updated[index], 
        [field]: value,
        startTime: sessionDefaultTimes[value] || '09:00',
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setSelectedSubjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSubjects.length === 0) {
      alert('Please add at least one subject');
      return;
    }
    
    const invalidSubject = selectedSubjects.find(s => !s.subjectId);
    if (invalidSubject) {
      alert('Please select a subject for all entries');
      return;
    }
    
    const examName = form.name || generatedExamName;

    const payload = {
      ...form,
      name: examName,
      subjects: selectedSubjects.map(s => ({
        classId: selectedClass,
        subjectId: s.subjectId,
        examDate: s.examDate,
        startTime: s.startTime,
        duration: s.duration,
        totalMarks: s.totalMarks || 100,
      })),
    };

    try {
      await createExam.mutateAsync(payload);
      navigate('/exams');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create exam';
      if (error.response?.status === 409) {
        alert('Exam already exists. New subjects have been added to the existing exam.');
        navigate('/exams');
      } else {
        alert(message);
      }
    }
  };

  if (teacherOptionsLoading) {
    return (
      <DashboardLayout title="Create Exam">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-2 focus:ring-[#1a3d30]/10 transition-all";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <DashboardLayout title="Create Exam">
      <button onClick={() => navigate('/exams')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Exams
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <StepIndicator number={1} label="Exam Details" active={step === 'details'} completed={step === 'subjects'} />
            <ChevronRight className="w-5 h-5 text-gray-300" />
            <StepIndicator number={2} label="Add Subjects" active={step === 'subjects'} completed={false} />
          </div>
        </div>

        {/* Step 1: Exam Details */}
        {step === 'details' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] rounded-xl p-5 mb-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Create New Exam</h2>
                  <p className="text-white/70 text-sm">Set up the exam details first ✨</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Exam Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls} required>
                    {availableExamTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Academic Term</label>
                  <input 
                    type="text" 
                    value={activeTerm?.name || 'No active term'} 
                    className={`${inputCls} bg-gray-50 text-gray-600`}
                    disabled 
                  />
                  <input type="hidden" name="termId" value={form.termId} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Exam Period Start *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Exam Period End *</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} required />
                </div>
              </div>

              <div>
                <label className={labelCls}>Select Class *</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Select a class</option>
                  {userClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} 
                      {cls.accessType === 'CLASS_TEACHER' && ' (Class Teacher)'}
                      {cls.accessType === 'SUBJECT_TEACHER' && ' (Subject Teacher)'}
                    </option>
                  ))}
                </select>
                {isTeacher && userClasses.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">You don't have any classes assigned. Contact administrator.</p>
                )}
                {isClassTeacherForSelected && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> You can add all subjects for this class as you are the Class Teacher
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Exam Name:</span> {generatedExamName || '—'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Auto-generated from exam type and term</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => navigate('/exams')} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#153328]">
                  Continue to Subjects <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Add Subjects */}
        {step === 'subjects' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{generatedExamName}</h2>
                <p className="text-gray-500 text-sm">{selectedClass && userClasses.find(c => c.id === selectedClass)?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Edit Details
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">Subjects</h3>
                <button
                  type="button"
                  onClick={addSubject}
                  className="flex items-center gap-1 text-sm text-[#1a3d30] hover:underline font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Subject
                </button>
              </div>

              {selectedSubjects.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No subjects added yet</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Add Subject" to include subjects in this exam</p>
                  {isClassTeacherForSelected && currentAvailableSubjects.length === 0 && (
                    <p className="text-amber-600 text-xs mt-2">No subjects configured for this class. Please add subjects to this class first.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {selectedSubjects.map((subject, index) => {
                    const usedSubjectIds = selectedSubjects
                      .filter((_, i) => i !== index)
                      .map(s => s.subjectId);
                    const availableForThisRow = currentAvailableSubjects.filter((s: any) => !usedSubjectIds.includes(s.id));

                    return (
                      <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="text-xs text-gray-500">Subject *</label>
                            <select
                              value={subject.subjectId}
                              onChange={(e) => updateSubject(index, 'subjectId', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                              required
                            >
                              <option value="">Select Subject</option>
                              {availableForThisRow.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Exam Date *</label>
                            <input
                              type="date"
                              value={subject.examDate}
                              onChange={(e) => updateSubject(index, 'examDate', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Session</label>
                            <select
                              value={subject.session}
                              onChange={(e) => updateSubject(index, 'session', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                            >
                              {sessionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Start Time</label>
                            <input
                              type="time"
                              value={subject.startTime}
                              onChange={(e) => updateSubject(index, 'startTime', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Duration (mins)</label>
                            <input
                              type="number"
                              value={subject.duration}
                              onChange={(e) => updateSubject(index, 'duration', parseInt(e.target.value) || 60)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Total Marks</label>
                            <input
                              type="number"
                              value={subject.totalMarks}
                              onChange={(e) => updateSubject(index, 'totalMarks', parseInt(e.target.value) || 100)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mt-1"
                            />
                          </div>
                          <div className="flex items-end">
                            <button 
                              type="button" 
                              onClick={() => removeSubject(index)} 
                              className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 flex items-center justify-center gap-1"
                            >
                              <X className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setStep('details')} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Back</button>
                <button type="submit" disabled={createExam.isPending || selectedSubjects.length === 0} className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#153328] disabled:opacity-50">
                  {createExam.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Save className="w-4 h-4" />Create Exam</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Step Indicator Component
function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
        completed ? 'bg-green-500 text-white' :
        active ? 'bg-[#1a3d30] text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {completed ? '✓' : number}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}
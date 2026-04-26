import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, User, BookOpen, Heart, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import { CreateStudentData } from '../../types';
import { Class } from '../../types/class';
import { useAuth } from '../../context/AuthContext';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';

export default function AddStudentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const [form, setForm] = useState<CreateStudentData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    classId: '',
    guardian: { name: '', phone: '', email: '', address: '' }
  });

  // Get all classes
  const { data: allClasses = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.data.data;
    },
  });

  // Get teacher's accessible classes to know which classes they can add students to
  const { data: teacherClassesData, isLoading: teacherClassesLoading } = useTeacherAccessibleClasses();

  // Determine which classes the user can add students to
  let availableClasses: Class[] = [];
  
  if (isAdmin) {
    availableClasses = allClasses;
  } else if (isTeacher && teacherClassesData) {
    // Class Teachers can add students to classes they are Class Teacher of
    availableClasses = allClasses.filter(cls => {
      const teacherClass = teacherClassesData.find((tc: any) => tc.id === cls.id);
      return teacherClass?.accessType === 'CLASS_TEACHER';
    });
  }

  const canAddStudents = isAdmin || (isTeacher && availableClasses.length > 0);

  const createMutation = useMutation({
    mutationFn: (data: CreateStudentData) => api.post('/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      navigate('/students');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create student');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that class is selected for class teachers
    if (isTeacher && !form.classId) {
      alert('Please select a class for the student');
      return;
    }
    
    createMutation.mutate(form);
  };

  // Show loading state
  if (isTeacher && teacherClassesLoading) {
    return (
      <DashboardLayout title="Add Student">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Teachers without class teacher assignment cannot add students
  if (isTeacher && !canAddStudents) {
    return (
      <DashboardLayout title="Add Student">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cannot Add Students</h3>
          <p className="text-yellow-700 mb-4">
            Only Class Teachers can add students to their classes.
          </p>
          <p className="text-yellow-600 text-sm">
            You are not assigned as a Class Teacher for any class. 
            Contact the administrator to get class teacher assignment.
          </p>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Students
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30]/20 transition-all";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Add Student">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => navigate('/students')} 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">New Student</h1>
                <p className="text-white/70 text-xs">
                  {isAdmin ? 'Fill in the details below ✨' : 'Add a new student to your class ✨'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Academic Section */}
            <div className="bg-gray-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[#1a3d30]" />
                <h3 className="font-medium text-sm text-gray-800">Academic</h3>
              </div>
              <div>
                <label className={labelCls}>
                  Assign to Class {isTeacher && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className={inputCls}
                  required={isTeacher}
                >
                  <option value="">Select a class {isTeacher ? '(Required)' : '(optional)'}</option>
                  {availableClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - Grade {cls.gradeLevel} ({cls.studentCount} students)
                      {isTeacher && ' (Your Class)'}
                    </option>
                  ))}
                </select>
                {isAdmin && (
                  <p className="text-[10px] text-gray-400 mt-1">Admission number auto-generates ✨</p>
                )}
                {isTeacher && (
                  <p className="text-[10px] text-green-600 mt-1">
                    Adding student to your class. Admission number will be auto-generated.
                  </p>
                )}
              </div>
            </div>

            {/* Personal Section */}
            <div className="bg-gray-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#1a3d30]" />
                <h3 className="font-medium text-sm text-gray-800">Personal</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Kwame"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Asare"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                      className={inputCls}
                    >
                      <option value="MALE">👦 Male</option>
                      <option value="FEMALE">👧 Female</option>
                      <option value="OTHER">🌈 Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input
                    type="text"
                    placeholder="Residential address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Guardian Section */}
            <div className="bg-gray-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-[#1a3d30]" />
                <h3 className="font-medium text-sm text-gray-800">Guardian</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Guardian's name"
                      value={form.guardian.name}
                      onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, name: e.target.value } })}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Phone *</label>
                    <input
                      type="tel"
                      placeholder="+233 XXX XXX XXX"
                      value={form.guardian.phone}
                      onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, phone: e.target.value } })}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    placeholder="guardian@email.com"
                    value={form.guardian.email}
                    onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, email: e.target.value } })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/students')}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 bg-[#1a3d30] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50 transition-all"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Student
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, User, GraduationCap, Heart, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import { Student, Class } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';

export default function EditStudentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    classId: '',
    guardian: {
      name: '',
      phone: '',
      email: '',
      address: '',
    },
  });

  // Get student data
  const { data: student, isLoading: loadingStudent } = useQuery<Student>({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await api.get(`/students/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Get all classes
  const { data: allClasses = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.data.data;
    },
  });

  // Get teacher's accessible classes to know which classes they can edit students from
  const { data: teacherClassesData, isLoading: teacherClassesLoading } = useTeacherAccessibleClasses();

  // Determine if user can edit this student
  let canEditStudent = false;
  let availableClassesForEdit: Class[] = [];

  if (isAdmin) {
    canEditStudent = true;
    availableClassesForEdit = allClasses;
  } else if (isTeacher && teacherClassesData && student) {
    // Check if teacher is the Class Teacher of the student's class
    const teacherClass = teacherClassesData.find((tc: any) => tc.id === student.class?.id);
    canEditStudent = teacherClass?.accessType === 'CLASS_TEACHER';
    
    // For class teachers, they can only move students within their own class
    // Or keep them in the same class - they cannot move students to other classes
    if (canEditStudent && student.class?.id) {
      availableClassesForEdit = allClasses.filter(cls => cls.id === student.class?.id);
    }
  }

  useEffect(() => {
    if (student) {
      setForm({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
        gender: student.gender || 'MALE',
        address: student.address || '',
        classId: student.class?.id || '',
        guardian: {
          name: student.guardian?.name || '',
          phone: student.guardian?.phone || '',
          email: student.guardian?.email || '',
          address: student.guardian?.address || '',
        },
      });
    }
  }, [student]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/students/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      alert('Student updated successfully!');
      navigate(`/students/${id}`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update student');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (loadingStudent || (isTeacher && teacherClassesLoading)) {
    return (
      <DashboardLayout title="Edit Student">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Check permission after student is loaded
  if (!canEditStudent) {
    return (
      <DashboardLayout title="Edit Student">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-700 mb-4">
            {isTeacher 
              ? "You don't have permission to edit this student. Only the Class Teacher of this student's class can edit student information."
              : "You don't have permission to edit this student."}
          </p>
          {isTeacher && (
            <p className="text-red-600 text-sm mb-6">
              You are not the Class Teacher for {student?.class?.name || 'this student\'s class'}.
              Class Teachers can only edit students in their own class.
            </p>
          )}
          <button
            onClick={() => navigate(`/students/${id}`)}
            className="px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Student
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30]/20 transition-all";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Edit Student">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(`/students/${id}`)} 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Student
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a3d30] to-[#2a5d50] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Edit Student</h1>
                <p className="text-white/70 text-xs">
                  {isAdmin ? 'Update student information' : 'Update student information in your class'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Personal Section */}
            <div className="bg-gray-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-[#1a3d30]" />
                <h3 className="font-medium text-sm text-gray-800">Personal Information</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input
                      type="text"
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
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className={inputCls}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Academic Section - Class selection */}
            <div className="bg-gray-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-[#1a3d30]" />
                <h3 className="font-medium text-sm text-gray-800">Academic Information</h3>
              </div>
              <div>
                <label className={labelCls}>
                  Class
                  {isTeacher && <span className="text-xs text-gray-400 ml-2">(Cannot change - student stays in your class)</span>}
                </label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className={inputCls}
                  disabled={isTeacher}
                >
                  {availableClassesForEdit.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - Grade {cls.gradeLevel}
                      {isTeacher && ' (Your Class)'}
                    </option>
                  ))}
                </select>
                {isTeacher && (
                  <p className="text-[10px] text-blue-600 mt-1">
                    Students remain in your class. Contact admin to change student's class.
                  </p>
                )}
              </div>
            </div>

            {/* Guardian Section */}
            <div className="bg-gray-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-[#1a3d30]" />
                <h3 className="font-medium text-sm text-gray-800">Guardian Information</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input
                      type="text"
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
                    value={form.guardian.email}
                    onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, email: e.target.value } })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Guardian Address</label>
                  <input
                    type="text"
                    value={form.guardian.address}
                    onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, address: e.target.value } })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/students/${id}`)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 bg-[#1a3d30] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50 transition-all"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
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
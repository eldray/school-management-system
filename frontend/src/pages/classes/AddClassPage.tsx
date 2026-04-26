import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCreateClass, useAvailableTeachers } from '../../hooks/useClasses';
import { CreateClassData } from '../../types/class';

// Expanded grade level options
const gradeLevels = [
  { value: 0, label: 'Kindergarten / Pre-School' },
  { value: 1, label: 'Grade 1' },
  { value: 2, label: 'Grade 2' },
  { value: 3, label: 'Grade 3' },
  { value: 4, label: 'Grade 4' },
  { value: 5, label: 'Grade 5' },
  { value: 6, label: 'Grade 6' },
  { value: 7, label: 'JHS 1 / Grade 7' },
  { value: 8, label: 'JHS 2 / Grade 8' },
  { value: 9, label: 'JHS 3 / Grade 9' },
  { value: 10, label: 'SHS 1 / Grade 10' },
  { value: 11, label: 'SHS 2 / Grade 11' },
  { value: 12, label: 'SHS 3 / Grade 12' },
];

export default function AddClassPage() {
  const navigate = useNavigate();
  const createClass = useCreateClass();
  const { data: teachers = [], isLoading: loadingTeachers } = useAvailableTeachers();

  const [form, setForm] = useState<CreateClassData>({
    name: '',
    gradeLevel: 0, // Change default to 0 (Kindergarten)
    stream: '',
    teacherProfileId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClass.mutateAsync(form);
      navigate('/classes');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create class');
    }
  };

  // Generate class name suggestion based on grade level
  const getSuggestedName = (gradeLevel: number) => {
    const grade = gradeLevels.find(g => g.value === gradeLevel);
    if (!grade) return '';
    if (gradeLevel === 0) return 'Kindergarten A';
    if (gradeLevel >= 7 && gradeLevel <= 9) return `JHS ${gradeLevel - 6}A`;
    if (gradeLevel >= 10 && gradeLevel <= 12) return `SHS ${gradeLevel - 9}A`;
    return `Grade ${gradeLevel}A`;
  };

  const handleGradeChange = (grade: number) => {
    setForm({ 
      ...form, 
      gradeLevel: grade,
      name: form.name || getSuggestedName(grade) // Auto-suggest name if empty
    });
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30]";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <DashboardLayout title="Add Class">
      <button
        onClick={() => navigate('/classes')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Class</h2>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Class Name *</label>
              <input
                type="text"
                placeholder="e.g., Kindergarten A, JHS 1A, SHS 2 Science"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Grade Level *</label>
              <select
                value={form.gradeLevel}
                onChange={(e) => handleGradeChange(parseInt(e.target.value))}
                className={inputCls}
                required
              >
                {gradeLevels.map(grade => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Stream (Optional)</label>
            <input
              type="text"
              placeholder="e.g., A, B, Science, Arts, Gold"
              value={form.stream}
              onChange={(e) => setForm({ ...form, stream: e.target.value })}
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">Use for class differentiation (e.g., A/B, Science/Arts)</p>
          </div>

          <div>
            <label className={labelCls}>Assign Class Teacher (Optional)</label>
            <select
              value={form.teacherProfileId}
              onChange={(e) => setForm({ ...form, teacherProfileId: e.target.value })}
              className={inputCls}
              disabled={loadingTeachers}
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName} - {teacher.qualification || 'Teacher'}
                </option>
              ))}
            </select>
            {loadingTeachers && (
              <p className="text-xs text-gray-400 mt-1">Loading teachers...</p>
            )}
          </div>

          {/* Preview Info */}
          {form.gradeLevel === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-sm text-blue-700">
                📚 Kindergarten class - Focus on foundational learning, social skills, and play-based activities.
              </p>
            </div>
          )}

          {form.gradeLevel >= 1 && form.gradeLevel <= 6 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm text-green-700">
                🎓 Primary School (Grade {form.gradeLevel}) - Building core academic foundations.
              </p>
            </div>
          )}

          {form.gradeLevel >= 7 && form.gradeLevel <= 9 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-sm text-purple-700">
                📖 Junior High School (JHS {form.gradeLevel - 6}) - Preparing for basic education certificate.
              </p>
            </div>
          )}

          {form.gradeLevel >= 10 && form.gradeLevel <= 12 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-sm text-orange-700">
                🎯 Senior High School (SHS {form.gradeLevel - 9}) - Specialized programs and WASSCE preparation.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/classes')}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClass.isPending}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
            >
              {createClass.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
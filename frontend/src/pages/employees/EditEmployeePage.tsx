import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Sparkles, BookOpen, X, Plus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useEmployee, useUpdateEmployee } from '../../hooks/useEmployees';
import { useSubjects } from '../../hooks/useExams';
import { useClasses } from '../../hooks/useClasses';
import { useAuth } from '../../context/AuthContext';
import { EmployeeType } from '../../types/user';

const employeeTypes: { value: EmployeeType; label: string }[] = [
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'ADMIN_STAFF', label: 'Admin Staff' },
  { value: 'CANTEEN', label: 'Canteen Staff' },
  { value: 'LIBRARIAN', label: 'Librarian' },
  { value: 'LAB_ASSISTANT', label: 'Lab Assistant' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'OTHER', label: 'Other' },
];

const departments = ['ACADEMIC', 'FINANCE', 'ADMINISTRATION', 'MAINTENANCE', 'SECURITY', 'TRANSPORT', 'CANTEEN', 'LIBRARY', 'LAB', 'OTHER'];

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: employee, isLoading } = useEmployee(id!);
  const { data: subjects = [] } = useSubjects();
  const { data: classes = [] } = useClasses();
  const updateEmployee = useUpdateEmployee();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    employeeType: 'TEACHER' as EmployeeType,
    department: 'ACADEMIC',
    position: '',
    qualification: '',
    subjects: [] as string[],
    salary: '',
    bankAccount: '',
    isActive: true,
  });

  const [subjectAssignments, setSubjectAssignments] = useState<{
    subjectId: string;
    classId: string;
  }[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canEdit = isAdmin;

  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.user.firstName || '',
        lastName: employee.user.lastName || '',
        phone: employee.user.phone || '',
        employeeType: employee.employeeType,
        department: employee.department || 'ACADEMIC',
        position: employee.position || '',
        qualification: employee.qualification || '',
        subjects: employee.subjects || [],
        salary: employee.salary?.toString() || '',
        bankAccount: employee.bankAccount || '',
        isActive: employee.user.isActive,
      });
      
      if (employee.teacherSubjects) {
        setSubjectAssignments(employee.teacherSubjects.map((ts: any) => ({
          subjectId: ts.subjectId,
          classId: ts.classId,
        })));
      }
    }
  }, [employee]);

  const addSubjectToArray = (subject: string) => {
    if (subject && !form.subjects.includes(subject)) {
      setForm({ ...form, subjects: [...form.subjects, subject] });
    }
    setNewSubject('');
  };

  const removeSubjectFromArray = (subject: string) => {
    setForm({ ...form, subjects: form.subjects.filter(s => s !== subject) });
  };

  const addSubjectAssignment = () => {
    if (!selectedSubject) { alert('Please select a subject'); return; }
    if (!selectedClass) { alert('Please select a class'); return; }
    
    const exists = subjectAssignments.find(a => a.subjectId === selectedSubject && a.classId === selectedClass);
    if (exists) { alert('This subject-class combination is already added'); return; }
    
    setSubjectAssignments([...subjectAssignments, { subjectId: selectedSubject, classId: selectedClass }]);
    
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name;
    if (subjectName && !form.subjects.includes(subjectName)) {
      setForm({ ...form, subjects: [...form.subjects, subjectName] });
    }
    
    setSelectedSubject('');
    setSelectedClass('');
  };

  const removeSubjectAssignment = (index: number) => {
    const removed = subjectAssignments[index];
    setSubjectAssignments(subjectAssignments.filter((_, i) => i !== index));
    
    const subjectName = subjects.find(s => s.id === removed.subjectId)?.name;
    if (subjectName) {
      const stillUsed = subjectAssignments.some((a, i) => i !== index && a.subjectId === removed.subjectId);
      if (!stillUsed) {
        setForm({ ...form, subjects: form.subjects.filter(s => s !== subjectName) });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        employeeType: form.employeeType,
        department: form.department,
        position: form.position,
        qualification: form.qualification,
        subjects: form.subjects,
        isActive: form.isActive,
      };
      if (form.salary) updateData.salary = parseFloat(form.salary);
      if (form.bankAccount) updateData.bankAccount = form.bankAccount;
      
      if (form.employeeType === 'TEACHER') {
        updateData.subjectAssignments = subjectAssignments;
      }
      
      await updateEmployee.mutateAsync({ id: id!, data: updateData });
      navigate(`/employees/${id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || id;

  const getAvailableSubjects = () => {
    if (!selectedClass) return subjects;
    const assignedSubjectIds = subjectAssignments.filter(a => a.classId === selectedClass).map(a => a.subjectId);
    return subjects.filter(s => !assignedSubjectIds.includes(s.id));
  };

  const isTeacher = form.employeeType === 'TEACHER';

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30] transition-all disabled:bg-gray-50 disabled:text-gray-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Employee">
        <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" /></div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Edit Employee">
        <div className="text-center py-12"><p className="text-gray-400">Employee not found</p></div>
      </DashboardLayout>
    );
  }

  if (!canEdit) {
    return (
      <DashboardLayout title="Edit Employee">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Access Denied</h3>
          <p className="text-gray-500">Only administrators can edit employees.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Employee">
      <button onClick={() => navigate(`/employees/${id}`)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Employee
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#1a3d30]" /> Edit Employee</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-50/50 rounded-xl p-5">
            <h3 className="font-semibold text-[#1a3d30] mb-4 text-sm uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name *</label><input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} required /></div>
              <div><label className={labelCls}>Last Name *</label><input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} required /></div>
              <div><label className={labelCls}>Phone Number</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Status</label><select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })} className={inputCls}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-gray-50/50 rounded-xl p-5">
            <h3 className="font-semibold text-[#1a3d30] mb-4 text-sm uppercase tracking-wider">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Employee Type</label><select value={form.employeeType} onChange={(e) => setForm({ ...form, employeeType: e.target.value as EmployeeType })} className={inputCls}>{employeeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className={labelCls}>Department</label><select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputCls}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div><label className={labelCls}>Position</label><input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Qualification</label><input type="text" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Salary (₵)</label><input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Bank Account</label><input type="text" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className={inputCls} /></div>
            </div>
          </div>

          {/* Teacher-specific */}
          {isTeacher && (
            <>
              <div className="bg-gray-50/50 rounded-xl p-5">
                <h3 className="font-semibold text-[#1a3d30] mb-4 text-sm uppercase tracking-wider">Subjects</h3>
                {form.subjects.length > 0 && (<div className="flex flex-wrap gap-2 mb-4">{form.subjects.map(s => (<span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3d30] text-white rounded-lg text-sm">{s}<button type="button" onClick={() => removeSubjectFromArray(s)} className="hover:bg-white/20 rounded-full p-0.5"><X className="w-3 h-3" /></button></span>))}</div>)}
                <div className="flex gap-2"><input type="text" placeholder="Add subject..." value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubjectToArray(newSubject))} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" /><button type="button" onClick={() => addSubjectToArray(newSubject)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"><Plus className="w-4 h-4" /></button></div>
              </div>

              <div className="bg-gray-50/50 rounded-xl p-5">
                <h3 className="font-semibold text-[#1a3d30] mb-4 text-sm uppercase tracking-wider">Subject-Class Assignments</h3>
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <div className="col-span-2"><select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(''); }} className={inputCls}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div className="col-span-2"><select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className={inputCls} disabled={!selectedClass}><option value="">Select Subject</option>{getAvailableSubjects().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <button type="button" onClick={addSubjectAssignment} disabled={!selectedClass || !selectedSubject} className="px-4 py-2.5 bg-[#1a3d30] text-white rounded-xl text-sm font-medium hover:bg-[#153328] disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                </div>

                {subjectAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(subjectAssignments.reduce((acc, a) => { const cn = getClassName(a.classId); if (!acc[cn]) acc[cn] = []; acc[cn].push(a); return acc; }, {} as Record<string, typeof subjectAssignments>)).map(([className, assignments]) => (
                      <div key={className} className="bg-white rounded-lg border border-gray-200 p-3">
                        <h4 className="font-medium text-gray-700 mb-2">{className}</h4>
                        <div className="flex flex-wrap gap-2">
                          {assignments.map((a, idx) => {
                            const globalIdx = subjectAssignments.findIndex(ga => ga.subjectId === a.subjectId && ga.classId === a.classId);
                            return (<span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3d30]/10 text-[#1a3d30] rounded-lg text-sm"><BookOpen className="w-3.5 h-3.5" />{getSubjectName(a.subjectId)}<button type="button" onClick={() => removeSubjectAssignment(globalIdx)} className="hover:bg-red-100 rounded-full p-0.5"><X className="w-3 h-3" /></button></span>);
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (<div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300"><BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No subjects assigned yet</p></div>)}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate(`/employees/${id}`)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updateEmployee.isPending} className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#153328] disabled:opacity-50">
              {updateEmployee.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
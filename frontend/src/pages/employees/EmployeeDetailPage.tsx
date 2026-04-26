import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, BookOpen, Calendar, Pencil, Trash2, Loader2, GraduationCap, Shield, CheckCircle, Banknote, Briefcase, MapPin, Building2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useEmployee, useDeleteEmployee, useActivateEmployee } from '../../hooks/useEmployees';
import { useAuth } from '../../context/AuthContext';

const employeeTypeLabels: Record<string, string> = {
  TEACHER: 'Teacher',
  ACCOUNTANT: 'Accountant',
  ADMIN_STAFF: 'Admin Staff',
  CANTEEN: 'Canteen Staff',
  LIBRARIAN: 'Librarian',
  LAB_ASSISTANT: 'Lab Assistant',
  SECURITY: 'Security',
  CLEANER: 'Cleaner',
  DRIVER: 'Driver',
  OTHER: 'Other',
};

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

  const { data: employee, isLoading } = useEmployee(id!);
  const deleteEmployee = useDeleteEmployee();
  const activateEmployee = useActivateEmployee();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canDelete = user?.role === 'SUPER_ADMIN';

  const handleDelete = async () => {
    try {
      await deleteEmployee.mutateAsync(id!);
      setShowDeleteModal(false);
      navigate('/employees');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to deactivate employee');
    }
  };

  const handleActivate = async () => {
    try {
      await activateEmployee.mutateAsync(id!);
      setShowActivateModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to activate employee');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return 'N/A';
    return `₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Employee Details">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Employee Details">
        <div className="text-center py-12">
          <p className="text-gray-400">Employee not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const isTeacher = employee.employeeType === 'TEACHER';

  return (
    <DashboardLayout title="Employee Details">
      <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-[#1a3d30] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {getInitials(employee.user.firstName, employee.user.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{employee.user.firstName} {employee.user.lastName}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${employee.user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {employee.user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-500">{employee.position || employee.qualification || '—'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>
                  {employeeTypeLabels[employee.employeeType]}
                </span>
                <span className="text-xs text-gray-400">ID: {employee.employeeId}</span>
              </div>
            </div>
          </div>
          
          {canManage && (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/employees/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                <Pencil className="w-4 h-4" /> Edit
              </button>
              {employee.user.isActive ? (
                canDelete && (
                  <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm hover:bg-red-100">
                    <Trash2 className="w-4 h-4" /> Deactivate
                  </button>
                )
              ) : (
                <button onClick={() => setShowActivateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl text-sm hover:bg-green-100">
                  <CheckCircle className="w-4 h-4" /> Activate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900">{employee.user.email}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm text-gray-900">{employee.user.phone || 'Not provided'}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">Joined</p><p className="text-sm text-gray-900">{formatDate(employee.joinDate)}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-gray-400" />
            <div><p className="text-xs text-gray-500">Salary</p><p className="text-sm text-gray-900">{formatCurrency(employee.salary)}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Employment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Department</span><span className="text-sm font-medium">{employee.department || '—'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Position</span><span className="text-sm font-medium">{employee.position || '—'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Qualification</span><span className="text-sm font-medium">{employee.qualification || '—'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Bank Account</span><span className="text-sm font-medium font-mono">{employee.bankAccount || '—'}</span></div>
            </div>
          </div>

          {isTeacher && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subjects</h3>
              {employee.subjects && employee.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {employee.subjects.map((subject, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">{subject}</span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No subjects assigned</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column (spans 2 cols) */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> {isTeacher ? 'Assigned Classes' : 'Department Information'}</h3>
            </div>
            
            {isTeacher ? (
              employee.teacherClasses && employee.teacherClasses.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {employee.teacherClasses.map((cls) => (
                    <div key={cls.id} className="p-5 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/classes/${cls.id}`)}>
                      <div className="flex items-center justify-between mb-2">
                        <div><h4 className="font-medium text-gray-900">{cls.name}</h4><p className="text-sm text-gray-500">Grade {cls.gradeLevel} {cls.stream && `• Stream ${cls.stream}`}</p></div>
                        <span className="text-sm text-gray-600">{cls.studentCount || 0} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No classes assigned yet</p></div>
              )
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Department Role</p>
                    <p className="font-medium text-gray-900">{employee.position || employee.employeeType}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Staff Type</p>
                    <p className="font-medium text-gray-900">{employeeTypeLabels[employee.employeeType]}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <div><h3 className="text-lg font-bold text-gray-900">Deactivate Employee</h3><p className="text-sm text-gray-500">This action can be reversed</p></div>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to deactivate <span className="font-semibold">{employee.user.firstName} {employee.user.lastName}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteEmployee.isPending} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteEmployee.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
              <div><h3 className="text-lg font-bold text-gray-900">Activate Employee</h3><p className="text-sm text-gray-500">Restore employee access</p></div>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to activate <span className="font-semibold">{employee.user.firstName} {employee.user.lastName}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowActivateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleActivate} disabled={activateEmployee.isPending} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {activateEmployee.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
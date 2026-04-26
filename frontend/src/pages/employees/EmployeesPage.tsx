import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, BookOpen, Loader2, Mail, Phone, Briefcase, GraduationCap, Shield, Filter, X, Eye, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useEmployees, useEmployeeStatistics, useDeleteEmployee, useActivateEmployee } from '../../hooks/useEmployees';
import { useAuth } from '../../context/AuthContext';

const employeeTypeLabels: Record<string, string> = {
  TEACHER: 'Teacher',
  ACCOUNTANT: 'Accountant',
  ADMIN_STAFF: 'Admin Staff',
  CANTEEN: 'Canteen',
  LIBRARIAN: 'Librarian',
  LAB_ASSISTANT: 'Lab Assistant',
  SECURITY: 'Security',
  CLEANER: 'Cleaner',
  DRIVER: 'Driver',
  OTHER: 'Other',
};

const employeeTypeColors: Record<string, string> = {
  TEACHER: 'bg-blue-100 text-blue-700',
  ACCOUNTANT: 'bg-green-100 text-green-700',
  ADMIN_STAFF: 'bg-purple-100 text-purple-700',
  CANTEEN: 'bg-orange-100 text-orange-700',
  LIBRARIAN: 'bg-indigo-100 text-indigo-700',
  LAB_ASSISTANT: 'bg-cyan-100 text-cyan-700',
  SECURITY: 'bg-red-100 text-red-700',
  CLEANER: 'bg-gray-100 text-gray-700',
  DRIVER: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState<string | null>(null);

  const { data: employees = [], isLoading, refetch } = useEmployees({
    employeeType: typeFilter === 'ALL' ? undefined : typeFilter,
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
  });
  const { data: statistics } = useEmployeeStatistics();
  const deleteEmployee = useDeleteEmployee();
  const activateEmployee = useActivateEmployee();

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canDelete = user?.role === 'SUPER_ADMIN';

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.user.firstName} ${emp.user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      emp.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee.mutateAsync(id);
      setShowDeleteModal(null);
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to deactivate employee');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateEmployee.mutateAsync(id);
      setShowActivateModal(null);
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to activate employee');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Employees">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Employees">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage all staff, teachers, and administrators
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => navigate('/employees/add')}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.totalEmployees || employees.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.activeEmployees || employees.filter(e => e.user.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(e => e.employeeType === 'TEACHER').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Other Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(e => e.employeeType !== 'TEACHER').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3d30]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <span className="ml-1 w-2 h-2 bg-[#1a3d30] rounded-full" />
            )}
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Types</option>
              {Object.entries(employeeTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {(typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1a3d30] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {getInitials(employee.user.firstName, employee.user.lastName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-[#1a3d30]" onClick={() => navigate(`/employees/${employee.id}`)}>
                        {employee.user.firstName} {employee.user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{employee.position || employee.qualification || '—'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.user.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {employee.user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-xs">{employee.user.email}</span>
                    </div>
                    {employee.user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs">{employee.user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${employeeTypeColors[employee.employeeType]}`}>
                        {employeeTypeLabels[employee.employeeType]}
                      </span>
                      {employee.employeeType === 'TEACHER' && (
                        <span className="text-xs text-gray-400">{employee.teacherClasses?.length || 0} classes</span>
                      )}
                    </div>
                  </div>

                  {/* Display subjects for teachers */}
                  {employee.employeeType === 'TEACHER' && employee.teacherSubjects && employee.teacherSubjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {employee.teacherSubjects.slice(0, 3).map((ts, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {ts.subject.name}
                        </span>
                      ))}
                      {employee.teacherSubjects.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          +{employee.teacherSubjects.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {canManage && (
                    <div className="mt-4 flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/employees/${employee.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 hover:bg-gray-100 py-1.5 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => navigate(`/employees/${employee.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:bg-blue-50 py-1.5 rounded transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      {employee.user.isActive ? (
                        canDelete && (
                          <button
                            onClick={() => setShowDeleteModal(employee.id)}
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-red-600 hover:bg-red-50 py-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Deactivate
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => setShowActivateModal(employee.id)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs text-green-600 hover:bg-green-50 py-1.5 rounded transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5" /> Activate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No employees found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Deactivate Employee</h3>
                <p className="text-sm text-gray-500">This action can be reversed</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate this employee? They will no longer be able to access the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleteEmployee.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteEmployee.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Activate Employee</h3>
                <p className="text-sm text-gray-500">Restore employee access</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to activate this employee? They will regain access to the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowActivateModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleActivate(showActivateModal)}
                disabled={activateEmployee.isPending}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {activateEmployee.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Users, Plus, Search, Mail, Phone, Shield, Calendar, Loader2, 
  MoreVertical, Edit, Trash2, UserPlus, X, Check, Eye, UserX 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../../config/permissions';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { User, CreateUserData, UpdateUserData, UserRole } from '../../types/user';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  PARENT: 'bg-orange-100 text-orange-700',
  STUDENT: 'bg-gray-100 text-gray-700',
  EMPLOYEE: 'bg-green-100 text-green-700', // Changed - employees are managed separately
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  PARENT: 'Parent/Guardian',
  STUDENT: 'Student',
  EMPLOYEE: 'Employee (Managed in Employees)',
};

// Only system users - teachers/staff are now Employees
const roleOptions: UserRole[] = ['ADMIN', 'PARENT', 'STUDENT'];

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
}

const initialFormData: UserFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'STUDENT',
  phone: '',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  
  const { data: users = [], isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  const canCreateUser = currentUser && hasPermission(currentUser.role, PERMISSIONS.CREATE_USER);
  const canUpdateUser = currentUser && hasPermission(currentUser.role, PERMISSIONS.UPDATE_USER);
  const canDeleteUser = currentUser && hasPermission(currentUser.role, PERMISSIONS.DELETE_USER);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filter out EMPLOYEE role from users list (they are managed in Employees page)
  const filteredUsers = users.filter((user: User) => {
    // Skip EMPLOYEE role in this page
    if (user.role === 'EMPLOYEE') return false;
    
    const matchesSearch = 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const activeUsers = users.filter(u => u.isActive && u.role !== 'EMPLOYEE').length;
  const studentsCount = users.filter(u => u.role === 'STUDENT').length;
  const parentsCount = users.filter(u => u.role === 'PARENT').length;

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof UserFormData, string>> = {};
    
    if (!formData.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    
    if (!showEditModal && !formData.password) errors.password = 'Password is required';
    else if (!showEditModal && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await createUser.mutateAsync(formData as CreateUserData);
      setShowAddModal(false);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!validateForm()) return;
    
    try {
      const updateData: UpdateUserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        phone: formData.phone || undefined,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await updateUser.mutateAsync({ id: showEditModal.id, data: updateData });
      setShowEditModal(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!showDeleteModal) return;
    
    try {
      await deleteUser.mutateAsync(showDeleteModal.id);
      setShowDeleteModal(null);
      setShowActionMenu(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await updateUser.mutateAsync({ 
        id: user.id, 
        data: { isActive: !user.isActive } 
      });
      setShowActionMenu(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const openEditModal = (user: User) => {
    setShowEditModal(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone || '',
    });
    setShowActionMenu(null);
  };

  const openDeleteModal = (user: User) => {
    setShowDeleteModal(user);
    setShowActionMenu(null);
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30]";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  if (isLoading) {
    return (
      <DashboardLayout title="User Management">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="User Management">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading users. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Users</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage parents, students, and admin users (Teachers and Staff are managed in Employees)
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/employees')}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              Manage Employees
            </button>
            {canCreateUser && (
              <button 
                onClick={() => {
                  setFormData(initialFormData);
                  setFormErrors({});
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328]"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-700">
            💡 Teachers and staff are now managed in the <strong>Employees</strong> section. This page is for parents and students only.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3d30]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3d30] bg-white"
          >
            <option value="ALL">All Roles</option>
            {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
            <option value="ADMIN">Administrators</option>
            <option value="PARENT">Parents</option>
            <option value="STUDENT">Students</option>
          </select>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredUsers.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{activeUsers}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{studentsCount}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Contact</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Last Login</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1a3d30] to-[#2a5d50] rounded-full flex items-center justify-center text-white">
                          <span className="text-sm font-medium">{getInitials(user.firstName, user.lastName)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-xs">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          user.isActive ? 'bg-green-600' : 'bg-gray-600'
                        }`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatDate(user.lastLogin)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right relative">
                      {(canUpdateUser || canDeleteUser) && (
                        <>
                          <button 
                            onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {showActionMenu === user.id && (
                            <div className="absolute right-4 top-12 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                              {canUpdateUser && (
                                <>
                                  <button
                                    onClick={() => openEditModal(user)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit User
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(user)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    {user.isActive ? (
                                      <>
                                        <UserX className="w-4 h-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4" />
                                        Activate
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                              {canDeleteUser && user.id !== currentUser?.id && (
                                <>
                                  <div className="h-px bg-gray-100 my-1" />
                                  <button
                                    onClick={() => openDeleteModal(user)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete User
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No users found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <UserFormModal
          title="Add New User"
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleCreateUser}
          onClose={() => {
            setShowAddModal(false);
            setFormErrors({});
          }}
          isPending={createUser.isPending}
          showPassword={true}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <UserFormModal
          title="Edit User"
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleUpdateUser}
          onClose={() => {
            setShowEditModal(null);
            setFormErrors({});
          }}
          isPending={updateUser.isPending}
          showPassword={false}
          isSuperAdmin={isSuperAdmin}
          currentUser={showEditModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            </div>
            <p className="text-gray-500 mb-2">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <p className="text-sm text-gray-700 mb-6">
              <strong>{showDeleteModal.firstName} {showDeleteModal.lastName}</strong> ({showDeleteModal.email})
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteUser.isPending}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteUser.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {showActionMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowActionMenu(null)} />
      )}
    </DashboardLayout>
  );
}

// User Form Modal Component
interface UserFormModalProps {
  title: string;
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  formErrors: Partial<Record<keyof UserFormData, string>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
  showPassword: boolean;
  isSuperAdmin: boolean;
  currentUser?: User;
}

function UserFormModal({
  title,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  onClose,
  isPending,
  showPassword,
  isSuperAdmin,
  currentUser,
}: UserFormModalProps) {
  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-1 focus:ring-[#1a3d30]";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  const availableRoles: UserRole[] = isSuperAdmin 
    ? ['SUPER_ADMIN', 'ADMIN', 'PARENT', 'STUDENT']
    : ['ADMIN', 'PARENT', 'STUDENT'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`${inputCls} ${formErrors.firstName ? 'border-red-400' : ''}`}
              />
              {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`${inputCls} ${formErrors.lastName ? 'border-red-400' : ''}`}
              />
              {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`${inputCls} ${formErrors.email ? 'border-red-400' : ''}`}
              disabled={!!currentUser}
            />
            {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
          </div>

          {showPassword && (
            <div>
              <label className={labelCls}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${inputCls} ${formErrors.password ? 'border-red-400' : ''}`}
                placeholder="Minimum 6 characters"
              />
              {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
            </div>
          )}

          {!showPassword && (
            <div>
              <label className={labelCls}>New Password (Optional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputCls}
                placeholder="Leave blank to keep current"
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputCls}
              placeholder="+233 XXX XXX XXX"
            />
          </div>

          <div>
            <label className={labelCls}>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className={inputCls}
              disabled={currentUser?.role === 'SUPER_ADMIN' && !isSuperAdmin}
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Teachers and staff are added in the Employees section</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-[#1a3d30] text-white rounded-lg hover:bg-[#153328] disabled:opacity-50 flex items-center justify-center gap-2">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
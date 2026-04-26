import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BookOpen, 
  Megaphone,
  Clock,
  BarChart3, 
  Shield,
  CalendarDays,
  Receipt,
  Briefcase,
  Layers,
  DollarSign,
  ClipboardList, 
  FileText,
  TrendingUp,
  Library,
  ChevronDown,
  ChevronRight,
  School
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MenuGroup {
  id: string;
  label: string;
  icon?: any;
  items: MenuItem[];
}

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  allowedRoles: string[];
  allowedEmployeeTypes?: string[]; // For EMPLOYEE role filtering
}

const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { 
        icon: LayoutDashboard, 
        label: 'Dashboard', 
        path: '/dashboard',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT', 'CANTEEN']
      },
      { 
        icon: Megaphone, 
        label: 'Announcements', 
        path: '/announcements',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER', 'PARENT', 'STUDENT', 'ACCOUNTANT']
      },
    ]
  },
  {
    id: 'academic',
    label: 'Academic',
    items: [
      { 
        icon: Users, 
        label: 'Students', 
        path: '/students',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER', 'ACCOUNTANT'],
        allowedEmployeeTypes: ['TEACHER', 'ACCOUNTANT', 'ADMIN_STAFF']
      },
      { 
        icon: UserCheck, 
        label: 'Employees', 
        path: '/employees',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN']
      },
      { 
        icon: BookOpen, 
        label: 'Classes', 
        path: '/classes',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER']
      },
      { 
        icon: Library,
        label: 'Subjects', 
        path: '/exams/subjects',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER']
      },
      { 
        icon: Clock, 
        label: 'Attendance', 
        path: '/attendance',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER']
      },
    ]
  },
  {
    id: 'exams',
    label: 'Examinations',
    items: [
      { 
        icon: CalendarDays,
        label: 'Exams', 
        path: '/exams',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER', 'PARENT', 'STUDENT']
      },
      { 
        icon: CalendarDays, 
        label: 'Timetable', 
        path: '/timetable',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER', 'PARENT', 'STUDENT']
      },
      { 
        icon: ClipboardList, 
        label: 'Assessments', 
        path: '/assessments',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER']
      },
      { 
        icon: FileText, 
        label: 'Report Cards', 
        path: '/report-cards',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'TEACHER', 'PARENT', 'STUDENT']
      },
      { 
        icon: TrendingUp, 
        label: 'Promotion', 
        path: '/promotion',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN']
      },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { 
        icon: Receipt,
        label: 'My Fees', 
        path: '/my-fees',
        allowedRoles: ['PARENT', 'STUDENT']
      },
      { 
        icon: Receipt, 
        label: 'Fees Management', 
        path: '/fees',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'ACCOUNTANT']
      },
      { 
        icon: Layers,
        label: 'Fee Templates', 
        path: '/fees/templates',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'ACCOUNTANT']
      },
      { 
        icon: DollarSign, 
        label: 'Fee Types', 
        path: '/fees/types',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'ACCOUNTANT']
      },
      { 
        icon: Users, 
        label: 'Assign Fees', 
        path: '/fees/assign',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'ACCOUNTANT']
      },
    ]
  },
  {
    id: 'staff',
    label: 'Staff',
    items: [
      { 
        icon: Briefcase, 
        label: 'Staff Management', 
        path: '/employees',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN']
      },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { 
        icon: BarChart3, 
        label: 'Reports', 
        path: '/reports',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'ACCOUNTANT', 'TEACHER']
      },
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { 
        icon: Shield, 
        label: 'Users', 
        path: '/users',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN']
      },
      { 
        icon: School, 
        label: 'School Settings', 
        path: '/settings',
        allowedRoles: ['SUPER_ADMIN', 'ADMIN']
      },
    ]
  },
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  EMPLOYEE: 'Employee',
  TEACHER: 'Teacher',
  ACCOUNTANT: 'Accountant',
  PARENT: 'Parent',
  STUDENT: 'Student',
  CANTEEN: 'Canteen Staff',
};

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    return ['main', 'academic'];
  });
  
  // Check if user has access to a menu item
  const hasAccess = (item: MenuItem): boolean => {
    if (!user?.role) return false;
    
    // Check role-based access
    if (!item.allowedRoles.includes(user.role)) return false;
    
    // For EMPLOYEE role, check employee type
    if (user.role === 'EMPLOYEE' && item.allowedEmployeeTypes) {
      const employeeType = user.employeeType || user.employee?.employeeType;
      if (!employeeType || !item.allowedEmployeeTypes.includes(employeeType)) {
        return false;
      }
    }
    
    return true;
  };
  
  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasAccess(item))
  })).filter(group => group.items.length > 0);
  
  useEffect(() => {
    const currentPath = location.pathname;
    
    filteredGroups.forEach(group => {
      const hasActiveItem = group.items.some(item => 
        currentPath === item.path || currentPath.startsWith(item.path + '/')
      );
      
      if (hasActiveItem && !expandedGroups.includes(group.id)) {
        setExpandedGroups(prev => [...prev, group.id]);
      }
    });
  }, [location.pathname, filteredGroups]);
  
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };
  
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'AU';
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email?.split('@')[0] || 'Admin User';
  };

  const getRoleDisplay = () => {
    if (user?.role === 'EMPLOYEE' && user.employeeType) {
      const typeLabels: Record<string, string> = {
        TEACHER: 'Teacher',
        ACCOUNTANT: 'Accountant',
        ADMIN_STAFF: 'Admin Staff',
        CANTEEN: 'Canteen Staff',
        LIBRARIAN: 'Librarian',
        LAB_ASSISTANT: 'Lab Assistant',
        SECURITY: 'Security',
        CLEANER: 'Cleaner',
        DRIVER: 'Driver',
        OTHER: 'Staff',
      };
      return typeLabels[user.employeeType] || 'Employee';
    }
    return user?.role ? roleLabels[user.role] : 'Admin';
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
  };

  return (
    <div className="w-64 bg-[#1a3d30] h-screen fixed flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a3d30] border border-white/20 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-white text-lg">School Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);
          const isActive = isGroupActive(group);
          
          return (
            <div key={group.id} className="space-y-0.5">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive 
                    ? 'text-white bg-white/10' 
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <span>{group.label}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              
              {isExpanded && (
                <div className="ml-2 pl-2 border-l border-white/10 space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 bg-gradient-to-br from-white/20 to-white/10 text-white rounded-full flex items-center justify-center font-semibold text-sm">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white leading-tight truncate">
              {getDisplayName()}
            </p>
            <p className="text-xs text-white/50 truncate">
              {getRoleDisplay()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
// Mirror of backend permissions for frontend use
export const PERMISSIONS = {
    // User Management
    CREATE_USER: 'create_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',
    VIEW_USERS: 'view_users',
    MANAGE_ROLES: 'manage_roles',
    
    // Student Management
    CREATE_STUDENT: 'create_student',
    UPDATE_STUDENT: 'update_student',
    DELETE_STUDENT: 'delete_student',
    VIEW_STUDENTS: 'view_students',
    VIEW_ALL_STUDENTS: 'view_all_students',
    VIEW_ASSIGNED_STUDENTS: 'view_assigned_students',
    
    // Teacher Management
    CREATE_TEACHER: 'create_teacher',
    UPDATE_TEACHER: 'update_teacher',
    DELETE_TEACHER: 'delete_teacher',
    VIEW_TEACHERS: 'view_teachers',
    
    // Class Management
    CREATE_CLASS: 'create_class',
    UPDATE_CLASS: 'update_class',
    DELETE_CLASS: 'delete_class',
    VIEW_CLASSES: 'view_classes',
    ASSIGN_TEACHER: 'assign_teacher',
    
    // Attendance
    RECORD_ATTENDANCE: 'record_attendance',
    VIEW_ATTENDANCE: 'view_attendance',
    VIEW_ALL_ATTENDANCE: 'view_all_attendance',
    EDIT_ATTENDANCE: 'edit_attendance',
    
    // Grades & Academics
    ENTER_GRADES: 'enter_grades',
    VIEW_GRADES: 'view_grades',
    VIEW_ALL_GRADES: 'view_all_grades',
    EDIT_GRADES: 'edit_grades',
    
    // Financial Management
    VIEW_FEES: 'view_fees',
    MANAGE_FEES: 'manage_fees',
    PROCESS_PAYMENTS: 'process_payments',
    VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
    GENERATE_INVOICES: 'generate_invoices',
    REFUND_PAYMENTS: 'refund_payments',
    
    // Communication
    POST_ANNOUNCEMENTS: 'post_announcements',
    SEND_MESSAGES: 'send_messages',
    VIEW_ANNOUNCEMENTS: 'view_announcements',
    
    // Reports
    GENERATE_REPORTS: 'generate_reports',
    VIEW_REPORTS: 'view_reports',
    EXPORT_DATA: 'export_data',
    
    // System Configuration
    CONFIGURE_SYSTEM: 'configure_system',
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    MANAGE_SETTINGS: 'manage_settings',
    
    // Canteen Management
    MANAGE_MEALS: 'manage_meals',
    RECORD_MEAL_ATTENDANCE: 'record_meal_attendance',
    VIEW_MEAL_REPORTS: 'view_meal_reports',
  } as const;
  
  export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
  
  // Role-based permission mapping (simplified for frontend)
  const RolePermissions: Record<string, Permission[]> = {
    SUPER_ADMIN: Object.values(PERMISSIONS),
    
    ADMIN: [
      PERMISSIONS.CREATE_USER,
      PERMISSIONS.UPDATE_USER,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.CREATE_STUDENT,
      PERMISSIONS.UPDATE_STUDENT,
      PERMISSIONS.DELETE_STUDENT,
      PERMISSIONS.VIEW_ALL_STUDENTS,
      PERMISSIONS.CREATE_TEACHER,
      PERMISSIONS.UPDATE_TEACHER,
      PERMISSIONS.VIEW_TEACHERS,
      PERMISSIONS.CREATE_CLASS,
      PERMISSIONS.UPDATE_CLASS,
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.ASSIGN_TEACHER,
      PERMISSIONS.VIEW_ALL_ATTENDANCE,
      PERMISSIONS.VIEW_ALL_GRADES,
      PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      PERMISSIONS.POST_ANNOUNCEMENTS,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.EXPORT_DATA,
    ],
    
    TEACHER: [
      PERMISSIONS.VIEW_ASSIGNED_STUDENTS,
      PERMISSIONS.RECORD_ATTENDANCE,
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.ENTER_GRADES,
      PERMISSIONS.VIEW_GRADES,
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.VIEW_ANNOUNCEMENTS,
    ],
    
    ACCOUNTANT: [
      PERMISSIONS.VIEW_FEES,
      PERMISSIONS.MANAGE_FEES,
      PERMISSIONS.PROCESS_PAYMENTS,
      PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      PERMISSIONS.GENERATE_INVOICES,
      PERMISSIONS.REFUND_PAYMENTS,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_STUDENTS,
    ],
    
    PARENT: [
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.VIEW_GRADES,
      PERMISSIONS.VIEW_FEES,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.VIEW_ANNOUNCEMENTS,
    ],
    
    STUDENT: [
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.VIEW_GRADES,
      PERMISSIONS.VIEW_ANNOUNCEMENTS,
    ],
    
    CANTEEN: [
      PERMISSIONS.MANAGE_MEALS,
      PERMISSIONS.RECORD_MEAL_ATTENDANCE,
      PERMISSIONS.VIEW_MEAL_REPORTS,
      PERMISSIONS.VIEW_STUDENTS,
      PERMISSIONS.VIEW_REPORTS,
    ],
  };
  
  // Helper function to check permissions on frontend
  export const hasPermission = (role: string, permission: Permission): boolean => {
    const permissions = RolePermissions[role] || [];
    return permissions.includes(permission);
  };
  
  // React hook for permission checking
  export const usePermission = () => {
    const { user } = useAuth();
    
    const can = (permission: Permission): boolean => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    };
    
    const canAny = (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.some(p => hasPermission(user.role, p));
    };
    
    const canAll = (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.every(p => hasPermission(user.role, p));
    };
    
    return { can, canAny, canAll };
  };
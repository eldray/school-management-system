export interface SchoolSettings {
    id: string;
    schoolName: string;
    schoolCode?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolLogo?: string;
    schoolMotto?: string;
    principalName?: string;
    establishedYear?: number;
    currentAcademicYear?: string;
    defaultTermType: 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
    allowParentLogin: boolean;
    allowStudentLogin: boolean;
    defaultLanguage: string;
    timezone: string;
    createdAt: string;
    updatedAt: string;
  }
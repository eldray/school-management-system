import prisma from '../config/prisma.js';
import { CreateClassInput, UpdateClassInput } from '../validators/class.validator.js';

export const createClass = async (data: CreateClassInput) => {
  // Check if class with same name already exists
  const existingClass = await prisma.class.findFirst({
    where: { 
      name: data.name,
      gradeLevel: data.gradeLevel,
      stream: data.stream 
    },
  });

  if (existingClass) {
    throw new Error('Class with this name, grade level, and stream already exists');
  }

  const classData = await prisma.class.create({
    data: {
      name: data.name,
      gradeLevel: data.gradeLevel,
      stream: data.stream || null,
      teacherProfileId: data.teacherProfileId || null, // Still using teacherProfileId for now
    },
    include: {
      teacherProfile: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          status: true,
        }
      },
    },
  });

  return classData;
};

export const getAllClasses = async (filters?: { gradeLevel?: number; hasTeacher?: boolean }) => {
  const whereClause: any = {};

  if (filters?.gradeLevel !== undefined && filters?.gradeLevel !== null) {
    whereClause.gradeLevel = filters.gradeLevel;
  }

  if (filters?.hasTeacher !== undefined) {
    whereClause.teacherProfileId = filters.hasTeacher ? { not: null } : null;
  }

  const classes = await prisma.class.findMany({
    where: whereClause,
    include: {
      teacherProfile: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
            }
          }
        }
      },
      classSubjects: {
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              category: true,
            }
          }
        },
        orderBy: {
          subject: {
            name: 'asc'
          }
        }
      },
      _count: {
        select: {
          students: {
            where: { status: 'ACTIVE' }
          },
        },
      },
    },
    orderBy: [
      { gradeLevel: 'asc' },
      { name: 'asc' },
    ],
  });

  return classes.map(cls => ({
    id: cls.id,
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    stream: cls.stream,
    teacherProfileId: cls.teacherProfileId,
    teacherProfile: cls.teacherProfile,
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
    studentCount: cls._count.students,
    subjectCount: cls.classSubjects.length,
    subjects: cls.classSubjects.map(cs => ({
      id: cs.subject.id,
      name: cs.subject.name,
      code: cs.subject.code,
      description: cs.subject.description,
      category: cs.subject.category,
    })),
    classSubjects: cls.classSubjects, // Keep original for detailed view if needed
  }));
};


export const getClassById = async (id: string) => {
  const classData = await prisma.class.findUnique({
    where: { id },
    include: {
      teacherProfile: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            }
          }
        }
      },
      classSubjects: {
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              category: true,
            }
          },
        },
        orderBy: {
          subject: {
            name: 'asc'
          }
        }
      },
      students: {
        where: {
          status: 'ACTIVE',
        },
        include: {
          guardian: true,
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
      },
    },
  });

  if (!classData) {
    throw new Error('Class not found');
  }

  // Get teacher subjects separately (teachers assigned to subjects in this class)
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: {
      classId: id,
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        }
      }
    },
  });

  // Group teacher subjects by subjectId
  const teacherSubjectsBySubject = teacherSubjects.reduce((acc, ts) => {
    const subjectId = ts.subjectId;
    if (!acc[subjectId]) {
      acc[subjectId] = [];
    }
    acc[subjectId].push(ts);
    return acc;
  }, {} as Record<string, typeof teacherSubjects>);

  // Merge teacher subjects into class subjects
  const classSubjectsWithTeachers = classData.classSubjects.map(cs => ({
    ...cs,
    teacherSubjects: teacherSubjectsBySubject[cs.subjectId] || [],
  }));

  return {
    id: classData.id,
    name: classData.name,
    gradeLevel: classData.gradeLevel,
    stream: classData.stream,
    teacherProfileId: classData.teacherProfileId,
    teacherProfile: classData.teacherProfile,
    createdAt: classData.createdAt,
    updatedAt: classData.updatedAt,
    studentCount: classData.students.length,
    subjectCount: classData.classSubjects.length,
    subjects: classData.classSubjects.map(cs => cs.subject),
    classSubjects: classSubjectsWithTeachers,
    students: classData.students,
  };
};

export const updateClass = async (id: string, data: UpdateClassInput) => {
  const existingClass = await prisma.class.findUnique({
    where: { id },
  });

  if (!existingClass) {
    throw new Error('Class not found');
  }

  const updatedClass = await prisma.class.update({
    where: { id },
    data: {
      name: data.name,
      gradeLevel: data.gradeLevel,
      stream: data.stream,
      teacherProfileId: data.teacherProfileId,
    },
    include: {
      teacherProfile: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          status: true,
        }
      },
    },
  });

  return updatedClass;
};

export const deleteClass = async (id: string) => {
  const classData = await prisma.class.findUnique({
    where: { id },
    include: {
      _count: {
        select: { students: true },
      },
    },
  });

  if (!classData) {
    throw new Error('Class not found');
  }

  if (classData._count.students > 0) {
    throw new Error('Cannot delete class with existing students. Please reassign students first.');
  }

  await prisma.class.delete({
    where: { id },
  });
};

export const assignTeacher = async (classId: string, teacherProfileId: string) => {
  // Verify teacher exists (using Employee model with TEACHER type)
  const teacher = await prisma.employee.findFirst({
    where: { 
      id: teacherProfileId,
      employeeType: 'TEACHER'
    },
    include: { user: true }
  });

  if (!teacher) {
    throw new Error('Teacher not found');
  }

  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data: { teacherProfileId },
    include: {
      teacherProfile: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
    },
  });

  return updatedClass;
};

export const removeTeacher = async (classId: string) => {
  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data: { teacherProfileId: null },
  });

  return updatedClass;
};

export const getClassesByTeacher = async (teacherProfileId: string) => {
  const classes = await prisma.class.findMany({
    where: { teacherProfileId },
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: [
      { gradeLevel: 'asc' },
      { name: 'asc' },
    ],
  });

  return classes.map(cls => ({
    ...cls,
    studentCount: cls._count.students,
  }));
};

// FIXED: Get available teachers using Employee model
export const getAvailableTeachers = async () => {
  // Get all employees with employeeType 'TEACHER' who are active
  const teachers = await prisma.employee.findMany({
    where: {
      employeeType: 'TEACHER',
      user: {
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
        }
      },
      teacherClasses: {
        select: {
          id: true,
          name: true,
        }
      },
      teacherSubjects: {
        include: {
          subject: true,
        }
      }
    },
    orderBy: {
      user: {
        lastName: 'asc',
      },
    },
  });

  return teachers.map(teacher => ({
    id: teacher.id,
    employeeId: teacher.employeeId,
    qualification: teacher.qualification,
    subjects: teacher.subjects,
    user: teacher.user,
    classes: teacher.teacherClasses,
    teacherSubjects: teacher.teacherSubjects,
  }));
};

export const getClassStatistics = async () => {
  const totalClasses = await prisma.class.count();
  
  const classesByGrade = await prisma.class.groupBy({
    by: ['gradeLevel'],
    _count: { id: true },
    orderBy: { gradeLevel: 'asc' },
  });

  const classesWithTeachers = await prisma.class.count({
    where: { teacherProfileId: { not: null } },
  });

  const totalStudents = await prisma.student.count({
    where: { status: 'ACTIVE' },
  });

  const averageClassSize = totalClasses > 0 ? totalStudents / totalClasses : 0;

  return {
    totalClasses,
    classesWithTeachers,
    totalStudents,
    averageClassSize: Math.round(averageClassSize * 10) / 10,
    classesByGrade,
  };
};

// Get teacher visible classes (with permissions for the frontend) - UPDATED for Employee model
export const getTeacherVisibleClasses = async (teacherUserId: string) => {
  // First find the employee record for this user
  const employee = await prisma.employee.findFirst({
    where: { user: { id: teacherUserId } },
    include: {
      teacherClasses: {
        include: {
          _count: { select: { students: true } }
        }
      },
      teacherSubjects: {
        include: { 
          class: {
            include: {
              _count: { select: { students: true } }
            }
          },
          subject: true 
        }
      },
    },
  });
  
  if (!employee) return [];
  
  const hasClassAssignments = employee.teacherClasses.length > 0;
  const hasSubjectAssignments = employee.teacherSubjects.length > 0;
  const isUnassigned = !hasClassAssignments && !hasSubjectAssignments;
  
  // Unassigned teachers - return ALL classes with VIEW_ONLY access
  if (isUnassigned) {
    const allClasses = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        stream: true,
        _count: { select: { students: true } }
      },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });
    
    return allClasses.map(c => ({
      ...c,
      accessType: 'VIEW_ONLY',
      canMarkAttendance: false,
      canViewStudents: false,
      canEnterResults: false,
    }));
  }
  
  // Assigned teachers - build classes with permissions
  const classMap = new Map();
  
  // Class Teacher classes (full permissions)
  employee.teacherClasses.forEach(c => {
    classMap.set(c.id, {
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      stream: c.stream,
      studentCount: c._count.students,
      accessType: 'CLASS_TEACHER',
      canMarkAttendance: true,
      canViewStudents: true,
      canEnterResults: true,
    });
  });
  
  // Subject Teacher classes (limited permissions)
  employee.teacherSubjects.forEach(ts => {
    if (!classMap.has(ts.class.id)) {
      classMap.set(ts.class.id, {
        id: ts.class.id,
        name: ts.class.name,
        gradeLevel: ts.class.gradeLevel,
        stream: ts.class.stream,
        studentCount: ts.class._count.students,
        accessType: 'SUBJECT_TEACHER',
        canMarkAttendance: false,
        canViewStudents: true,
        canEnterResults: true,
        subjects: [{
          id: ts.subject.id,
          name: ts.subject.name,
          code: ts.subject.code,
        }],
      });
    } else {
      const existing = classMap.get(ts.class.id);
      if (!existing.subjects) existing.subjects = [];
      existing.subjects.push({
        id: ts.subject.id,
        name: ts.subject.name,
        code: ts.subject.code,
      });
      classMap.set(ts.class.id, existing);
    }
  });
  
  return Array.from(classMap.values());
};
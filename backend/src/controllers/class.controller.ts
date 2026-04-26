import { Request, Response } from 'express';
import * as classService from '../services/class.service.js';
import * as attendanceService from '../services/attendance.service.js'; // Add this import
import { createClassSchema, updateClassSchema } from '../validators/class.validator.js';
import prisma from '../config/prisma.js';

// Add AuthRequest interface
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    studentId?: string;
    teacherId?: string;
    parentId?: string;
    studentIds?: string[];
    accountantId?: string;
  };
}

export const createClassController = async (req: Request, res: Response) => {
  try {
    const validatedData = createClassSchema.parse(req.body);
    const classData = await classService.createClass(validatedData);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classData,
    });
  } catch (error: any) {
    console.error('Create class error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create class',
    });
  }
};

// Get classes visible to the logged-in teacher
export const getTeacherVisibleClassesController = async (req: AuthRequest, res: Response) => {
  try {
    const teacherUserId = req.user?.id;
    const classes = await attendanceService.getTeacherVisibleClasses(teacherUserId!);
    
    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    console.error('Get teacher visible classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch classes',
    });
  }
};

export const getTeacherAccessibleClassesController = async (req: AuthRequest, res: Response) => {
  try {
    const teacherUserId = req.user?.id;
    
    if (!teacherUserId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const teacher = await prisma.teacherProfile.findFirst({
      where: { user: { id: teacherUserId } },
      include: {
        classes: {
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
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found',
      });
    }
    
    const hasClassAssignments = teacher.classes.length > 0;
    const hasSubjectAssignments = teacher.teacherSubjects.length > 0;
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
      
      return res.status(200).json({
        success: true,
        data: allClasses.map(c => ({
          ...c,
          accessType: 'VIEW_ONLY',
          canMarkAttendance: false,
          canViewStudents: false,
          canEnterResults: false,
        })),
      });
    }
    
    // Assigned teachers - build classes with permissions
    const classMap = new Map();
    
    // Class Teacher classes (full permissions)
    teacher.classes.forEach(c => {
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
    teacher.teacherSubjects.forEach(ts => {
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
        // Add subject to existing class entry
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
    
    const accessibleClasses = Array.from(classMap.values());
    
    res.status(200).json({
      success: true,
      data: accessibleClasses,
    });
  } catch (error: any) {
    console.error('Get teacher accessible classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch classes',
    });
  }
};

export const getAllClassesController = async (req: Request, res: Response) => {
  try {
    const { gradeLevel, hasTeacher } = req.query;
    const classes = await classService.getAllClasses({
      gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
      hasTeacher: hasTeacher === 'true' ? true : hasTeacher === 'false' ? false : undefined,
    });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error: any) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch classes',
    });
  }
};

export const getClassByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classData = await classService.getClassById(id);

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error: any) {
    console.error('Get class error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Class not found',
    });
  }
};

export const updateClassController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateClassSchema.parse(req.body);
    const classData = await classService.updateClass(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: classData,
    });
  } catch (error: any) {
    console.error('Update class error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update class',
    });
  }
};

export const deleteClassController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await classService.deleteClass(id);

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete class error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete class',
    });
  }
};

export const assignTeacherController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { teacherProfileId } = req.body;

    if (!teacherProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required',
      });
    }

    const classData = await classService.assignTeacher(classId, teacherProfileId);

    res.status(200).json({
      success: true,
      message: 'Teacher assigned successfully',
      data: classData,
    });
  } catch (error: any) {
    console.error('Assign teacher error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to assign teacher',
    });
  }
};

export const removeTeacherController = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const classData = await classService.removeTeacher(classId);

    res.status(200).json({
      success: true,
      message: 'Teacher removed successfully',
      data: classData,
    });
  } catch (error: any) {
    console.error('Remove teacher error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove teacher',
    });
  }
};

export const getAvailableTeachersController = async (req: Request, res: Response) => {
  try {
    const teachers = await classService.getAvailableTeachers();

    res.status(200).json({
      success: true,
      data: teachers,
    });
  } catch (error: any) {
    console.error('Get available teachers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teachers',
    });
  }
};

export const getClassStatisticsController = async (req: Request, res: Response) => {
  try {
    const statistics = await classService.getClassStatistics();

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('Get class statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics',
    });
  }
};
import { Request, Response } from 'express';
import { 
  createStudent, 
  getAllStudents, 
  getStudentById,
  updateStudent,
  deleteStudent,
  activateStudent  
} from '../services/student.service.js';
import { createStudentSchema } from '../validators/student.validator.js';

export const createStudentController = async (req: Request, res: Response) => {
  try {
    const validatedData = createStudentSchema.parse(req.body);
    const student = await createStudent(validatedData);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create student' 
    });
  }
};

export const getStudentsController = async (req: Request, res: Response) => {
  try {
    const students = await getAllStudents();
    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error: any) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch students' 
    });
  }
};

export const getStudentByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await getStudentById(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error: any) {
    console.error('Get student error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch student' 
    });
  }
};

export const updateStudentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await updateStudent(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error: any) {
    console.error('Update student error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update student' 
    });
  }
};

export const deleteStudentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteStudent(id);
    
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete student error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to delete student' 
    });
  }
};

export const activateStudentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await activateStudent(id);
    
    res.status(200).json({
      success: true,
      message: 'Student activated successfully',
      data: student,
    });
  } catch (error: any) {
    console.error('Activate student error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to activate student' 
    });
  }
};
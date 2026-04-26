import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      studentId: decoded.studentId,
      employeeId: decoded.employeeId,  // Added
      employeeType: decoded.employeeType, // Added
      parentId: decoded.parentId,
      studentIds: decoded.studentIds,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized. User not found.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You do not have permission to access this resource.' 
      });
    }
    
    next();
  };
};
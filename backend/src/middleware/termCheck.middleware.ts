import { Request, Response, NextFunction } from 'express';
import * as termService from '../services/term.service.js';

// Middleware to check and auto-advance terms on each request
export const checkTermAdvancement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only check periodically (once per hour per user session to avoid overloading)
    // You can implement a cache mechanism if needed
    await termService.checkAndAutoAdvance();
    next();
  } catch (error) {
    console.error('Term advancement check error:', error);
    next(); // Don't block the request
  }
};
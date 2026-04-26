import { Request, Response } from 'express';
import * as termService from '../services/term.service.js';

export const createTerm = async (req: Request, res: Response) => {
  try {
    const term = await termService.createTerm({
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    });
    
    res.status(201).json({ success: true, data: term });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllTerms = async (req: Request, res: Response) => {
  try {
    const terms = await termService.getAllTerms();
    res.status(200).json({ success: true, data: terms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveTerm = async (req: Request, res: Response) => {
  try {
    const term = await termService.getActiveTerm();
    res.status(200).json({ success: true, data: term });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setActiveTerm = async (req: Request, res: Response) => {
  try {
    const term = await termService.setActiveTerm(req.params.id);
    res.status(200).json({ success: true, data: term, message: 'Term activated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTerm = async (req: Request, res: Response) => {
  try {
    const term = await termService.updateTerm(req.params.id, {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    });
    res.status(200).json({ success: true, data: term });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTerm = async (req: Request, res: Response) => {
  try {
    await termService.deleteTerm(req.params.id);
    res.status(200).json({ success: true, message: 'Term deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// AUTO PROGRESSION ENDPOINTS
// ============================================

export const autoAdvanceTerm = async (req: Request, res: Response) => {
  try {
    const result = await termService.autoAdvanceTerm();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTermProgressionStatus = async (req: Request, res: Response) => {
  try {
    const status = await termService.getTermProgressionStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkAndAutoAdvance = async (req: Request, res: Response) => {
  try {
    const result = await termService.checkAndAutoAdvance();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
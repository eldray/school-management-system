import { Request, Response } from 'express';
import { login, registerAdmin } from '../services/auth.service.js';

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const registerController = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const user = await registerAdmin(email, password, name);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};


import { Request, Response } from 'express';
import * as userService from '../services/user.service.js';

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const users = await userService.getAllUsers({
      role: role as string,
    });
    
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user',
    });
  }
};

export const createUserController = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    
    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
};

export const getProfileController = async (req: any, res: Response) => {
  try {
    const user = await userService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
};
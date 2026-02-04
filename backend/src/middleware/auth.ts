import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

/**
 * Extended Request interface with user data
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

/**
 * IMPORTANT: Authentication middleware
 * Verifies JWT token and checks user status
 * 
 * FIFTH REQUIREMENT: Before each request except registration/login,
 * server checks if user exists and isn't blocked
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided. Please login.' 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: number;
      email: string;
    };
    
    /**
     * NOTA BENE: Check if user exists and get their current status
     * This is critical - user might have been deleted or blocked after token was issued
     */
    const result = await pool.query(
      'SELECT id, email, status FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      // User was deleted - redirect to login
      return res.status(401).json({ 
        error: 'User account not found. Please login again.',
        redirect: true 
      });
    }
    
    const user = result.rows[0];
    
    /**
     * IMPORTANT: Check if user is blocked
     * Blocked users cannot access any protected routes
     */
    if (user.status === 'blocked') {
      return res.status(403).json({ 
        error: 'Your account has been blocked. Please contact administrator.',
        redirect: true 
      });
    }
    
    // Attach user info to request for use in route handlers
    req.user = {
      id: user.id,
      email: user.email
    };
    
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token. Please login again.',
        redirect: true 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed' 
    });
  }
};

/**
 * Optional middleware: Update last login time
 * Can be used on protected routes to track activity
 */
export const updateLastLogin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    try {
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [req.user.id]
      );
    } catch (error) {
      console.error('Failed to update last login:', error);
      // Don't block the request if this fails
    }
  }
  next();
};

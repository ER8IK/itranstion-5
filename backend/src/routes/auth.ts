import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { sendVerificationEmail, parseVerificationToken } from '../services/emailService';
import { UserDTO } from '../models/User';

const router = express.Router();

/**
 * IMPORTANT: User registration endpoint
 * Creates user immediately and sends verification email asynchronously
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'), // Any non-empty password allowed
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      /**
       * NOTA BENE: Insert user into database
       * The UNIQUE INDEX on email will automatically reject duplicates
       * We don't check for existence in code - the database handles it
       */
      const result = await pool.query(
        `INSERT INTO users (name, email, password, status) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, name, email, status, created_at`,
        [name, email, hashedPassword, 'unverified']
      );

      const user = result.rows[0];

      /**
       * IMPORTANT: Send verification email ASYNCHRONOUSLY
       * This doesn't block the response - user sees success message immediately
       */
      sendVerificationEmail(email, name, user.id).catch(err => {
        console.error('Async email send failed:', err);
      });

      // Return success response immediately
      res.status(201).json({
        message: 'Registration successful! A verification email has been sent to your email address.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
        },
      });

    } catch (error: any) {
      /**
       * NOTA BENE: Handle unique constraint violation
       * Error code 23505 is PostgreSQL's unique violation error
       */
      if (error.code === '23505') {
        return res.status(400).json({ 
          error: 'This email is already registered. Please use a different email or login.' 
        });
      }

      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

/**
 * IMPORTANT: User login endpoint
 * Blocked users cannot login, returns appropriate error
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = result.rows[0];

      /**
       * IMPORTANT: Check if user is blocked
       * Blocked users cannot login
       */
      if (user.status === 'blocked') {
        return res.status(403).json({ 
          error: 'Your account has been blocked. Please contact administrator.' 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login time
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        (process.env.JWT_SECRET || 'secret') as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      // Return user data and token
      const userDTO: UserDTO = {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        last_login: user.last_login,
        created_at: user.created_at,
      };

      res.json({
        message: 'Login successful',
        token,
        user: userDTO,
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

/**
 * Email verification endpoint
 * Changes status from 'unverified' to 'active'
 * If user is blocked, they stay blocked
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const parsed = parseVerificationToken(token);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    /**
     * NOTA BENE: Update status from unverified to active
     * Blocked users stay blocked (they're not in WHERE clause)
     */
    const result = await pool.query(
      `UPDATE users 
       SET status = 'active' 
       WHERE id = $1 AND email = $2 AND status = 'unverified'
       RETURNING id, email, status`,
      [parsed.userId, parsed.email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Verification failed. User may already be verified or blocked.' 
      });
    }

    res.json({
      message: 'Email verified successfully! You can now login.',
      user: result.rows[0],
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

export default router;

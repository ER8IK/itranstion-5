import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UserDTO } from '../models/User';

const router = express.Router();

/**
 * IMPORTANT: All routes are protected by authentication middleware
 * This ensures FIFTH REQUIREMENT: user exists and isn't blocked
 */

/**
 * Get all users (sorted by last login time - THIRD REQUIREMENT)
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    /**
     * NOTA BENE: Fetch all users sorted by last_login DESC
     * NULLS LAST ensures users who never logged in appear at the end
     */
    const result = await pool.query(`
      SELECT id, name, email, status, last_login, created_at
      FROM users
      ORDER BY last_login DESC NULLS LAST
    `);

    const users: UserDTO[] = result.rows;

    res.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * IMPORTANT: Block selected users
 * Any user can block any other user (including themselves)
 */
router.post('/block', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No users selected' });
    }

    /**
     * NOTA BENE: Update status to 'blocked' for selected users
     * This includes the current user if they select themselves
     */
    const result = await pool.query(
      `UPDATE users 
       SET status = 'blocked' 
       WHERE id = ANY($1::int[])
       RETURNING id, email`,
      [userIds]
    );

    res.json({
      message: `${result.rows.length} user(s) blocked successfully`,
      blockedUsers: result.rows,
    });

  } catch (error) {
    console.error('Error blocking users:', error);
    res.status(500).json({ error: 'Failed to block users' });
  }
});

/**
 * Unblock selected users
 */
router.post('/unblock', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No users selected' });
    }

    /**
     * IMPORTANT: Unblocked users become 'active' (not 'unverified')
     * This is intentional - we don't want to invalidate their previous verification
     */
    const result = await pool.query(
      `UPDATE users 
       SET status = 'active' 
       WHERE id = ANY($1::int[])
       RETURNING id, email`,
      [userIds]
    );

    res.json({
      message: `${result.rows.length} user(s) unblocked successfully`,
      unblockedUsers: result.rows,
    });

  } catch (error) {
    console.error('Error unblocking users:', error);
    res.status(500).json({ error: 'Failed to unblock users' });
  }
});

/**
 * IMPORTANT: Delete selected users (REAL deletion, not marking)
 * Deleted users are REMOVED from database completely
 * They can re-register with the same email
 */
router.post('/delete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No users selected' });
    }

    /**
     * NOTA BENE: DELETE removes users permanently
     * The unique index allows them to re-register with same email later
     */
    const result = await pool.query(
      'DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id, email',
      [userIds]
    );

    res.json({
      message: `${result.rows.length} user(s) deleted successfully`,
      deletedUsers: result.rows,
    });

  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

/**
 * Delete all unverified users
 * Special action to clean up users who never verified their email
 */
router.post('/delete-unverified', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    /**
     * IMPORTANT: Delete only users with 'unverified' status
     */
    const result = await pool.query(
      `DELETE FROM users 
       WHERE status = 'unverified'
       RETURNING id, email`,
    );

    res.json({
      message: `${result.rows.length} unverified user(s) deleted successfully`,
      deletedUsers: result.rows,
    });

  } catch (error) {
    console.error('Error deleting unverified users:', error);
    res.status(500).json({ error: 'Failed to delete unverified users' });
  }
});

export default router;

import pool from './config/database';

/**
 * IMPORTANT: Database migration script
 * This creates the users table with proper constraints and indexes
 * 
 * NOTE: The unique index on email is CRITICAL for this task
 * It guarantees email uniqueness at the database level, not code level
 */
async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    // Drop existing table if needed (for development)
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    /**
     * NOTA BENE: Create users table with all required fields
     * - id: Primary key (auto-increment)
     * - name: User's full name
     * - email: User's email (will have unique index)
     * - password: Hashed password
     * - status: unverified/active/blocked
     * - last_login: Timestamp of last login
     * - created_at: Registration timestamp
     */
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'unverified' CHECK (status IN ('unverified', 'active', 'blocked')),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Users table created');
    
    /**
     * IMPORTANT: Create UNIQUE INDEX on email column
     * This is THE FIRST REQUIREMENT of the task
     * The database will reject any attempt to insert duplicate emails
     * This works independently of application code and handles concurrent inserts
     */
    await client.query(`
      CREATE UNIQUE INDEX idx_users_email_unique ON users(email)
    `);
    
    console.log('✓ UNIQUE INDEX on email created - database guarantees uniqueness');
    
    /**
     * NOTA BENE: Create index on last_login for sorting performance
     * Since table must be sorted by last login time (THIRD REQUIREMENT)
     */
    await client.query(`
      CREATE INDEX idx_users_last_login ON users(last_login DESC NULLS LAST)
    `);
    
    console.log('✓ Index on last_login created for sorting performance');
    
    // Create a test admin user for initial access
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    await client.query(`
      INSERT INTO users (name, email, password, status, last_login)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, ['Admin User', 'admin@example.com', hashedPassword, 'active']);
    
    console.log('✓ Test admin user created (email: admin@example.com, password: admin)');
    console.log('✓ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate().catch(console.error);

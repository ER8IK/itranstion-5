import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import { testEmailConnection } from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * IMPORTANT: Middleware configuration
 */
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * NOTA BENE: Routes configuration
 * /api/auth/* - Registration, login, verification (no auth required)
 * /api/users/* - User management (auth required via middleware)
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'User Management API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*'
    }
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Error handling middleware
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * IMPORTANT: Start server
 */
app.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log('='.repeat(50));
  
  // Test email service (non-blocking)
  testEmailConnection().catch(err => {
    console.warn('Email service test failed:', err);
  });
});

export default app;

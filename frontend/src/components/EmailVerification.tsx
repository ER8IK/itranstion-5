import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container, Card, Alert, Spinner } from 'react-bootstrap';
import { authAPI } from '../services/api';

/**
 * Email verification component
 * Handles email verification from link
 */
const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await authAPI.verify(token);
      setStatus('success');
      setMessage(response.message);
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <Card className="shadow-sm">
          <Card.Body className="p-4 text-center">
            <h2 className="mb-4">Email Verification</h2>
            
            {status === 'loading' && (
              <>
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p>Verifying your email...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <Alert variant="success">
                  <i className="bi bi-check-circle-fill fs-1 d-block mb-2"></i>
                  {message}
                </Alert>
                <p className="text-muted">Redirecting to login...</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <Alert variant="danger">
                  <i className="bi bi-x-circle-fill fs-1 d-block mb-2"></i>
                  {message}
                </Alert>
                <Link to="/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default EmailVerification;

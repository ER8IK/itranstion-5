import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * IMPORTANT: Protected route component
 * Ensures only authenticated users can access certain routes
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');

  /**
   * NOTA BENE: Redirect to login if no token
   * Non-authenticated users should not have access to user management
   */
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

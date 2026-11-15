import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { SessionValidationError } from './SessionValidationError';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, validationFailed, preserveReturnTo, token } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (validationFailed) return <SessionValidationError />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={preserveReturnTo ? { from: location } : null} replace />;
  }

  // Remount observers even when a cross-tab identity change validates immediately.
  return <React.Fragment key={token}>{children}</React.Fragment>;
};

export default ProtectedRoute;


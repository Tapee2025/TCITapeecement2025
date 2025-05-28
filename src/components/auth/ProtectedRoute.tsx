import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (userData && !allowedRoles.includes(userData.role as UserRole)) {
    // Redirect to appropriate dashboard based on role
    if (userData.role === 'admin') {
      return <Navigate to="/admin/dashboard\" replace />;
    } else if (userData.role === 'dealer') {
      return <Navigate to="/dealer/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard\" replace />;
    }
  }

  return <Outlet />;
}
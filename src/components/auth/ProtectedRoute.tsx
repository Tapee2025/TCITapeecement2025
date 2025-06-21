import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Get the user's profile data
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        // If no profile found, sign out the user
        if (!profile) {
          console.log('No user profile found, signing out user');
          await supabase.auth.signOut();
          setUser(null);
          setUserData(null);
        } else {
          setUserData(profile);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // On error, clear user state
      setUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not logged in or no profile found
  if (!user || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (!allowedRoles.includes(userData.role as UserRole)) {
    // Redirect to appropriate dashboard based on role
    if (userData.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userData.role === 'dealer') {
      return <Navigate to="/dealer/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSessionChecked, setIsSessionChecked] = React.useState(false);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Only set loading to false after we've checked the session
        setIsSessionChecked(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoading(false);
        setIsSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  // Show loading state while checking session
  if (isLoading || !isSessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only redirect to login if we've checked the session and there's no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

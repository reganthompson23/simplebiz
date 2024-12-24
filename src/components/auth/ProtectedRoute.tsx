import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { config } from '../../config';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSessionChecked, setIsSessionChecked] = React.useState(false);

  React.useEffect(() => {
    const checkSession = async () => {
      console.log('=== Protected Route Session Check ===');
      console.log('1. Starting session check...');
      
      // Log what's in localStorage
      const storageKey = 'sb-' + config.supabase.url.split('//')[1].split('.')[0] + '-auth-token';
      const storedSession = localStorage.getItem(storageKey);
      console.log('2. localStorage token exists:', !!storedSession);
      
      try {
        console.log('3. Fetching session from Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('4. Session error:', error);
          throw error;
        }
        
        console.log('4. Session result:', session ? 'Found' : 'Not found');
        console.log('5. User from useAuth:', user ? 'Present' : 'Not present');
        
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
  }, [user]); // Added user to dependencies

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
    console.log('=== Protected Route Redirect ===');
    console.log('No user found after session check, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

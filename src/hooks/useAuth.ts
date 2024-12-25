import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, setUser, isInitialized, setIsInitialized, cleanup } = useAuthStore();
  const isInitializing = useRef(false);
  const refreshTimeout = useRef<NodeJS.Timeout>();

  // Function to refresh session
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        // Refresh the session 5 minutes before it expires
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const timeUntilExpire = new Date(expiresAt * 1000).getTime() - Date.now();
          const refreshTime = Math.max(0, timeUntilExpire - (5 * 60 * 1000)); // 5 minutes before expiry
          
          if (refreshTimeout.current) {
            clearTimeout(refreshTimeout.current);
          }
          
          refreshTimeout.current = setTimeout(refreshSession, refreshTime);
        }
        
        return session;
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
    return null;
  };

  // Handle page refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanup]);

  useEffect(() => {
    let mounted = true;
    console.log('=== useAuth Effect Start ===');
    console.log('Current user state:', user?.id);

    // Function to fetch and set user profile
    const fetchAndSetUserProfile = async (userId: string) => {
      console.log('Fetching profile...', userId);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          throw error;
        }
        if (data && mounted) {
          console.log('Profile found:', data.id);
          setUser(data as User);
          return true;
        } else {
          console.log('No profile data found');
          return false;
        }
      } catch (error) {
        console.error('Error in fetchAndSetUserProfile:', error);
        if (mounted) {
          console.log('Setting user to null due to error');
          setUser(null);
        }
        return false;
      }
    };

    // Initial session check
    const initializeAuth = async () => {
      if (!mounted || isInitializing.current) return;
      
      isInitializing.current = true;
      console.log('Starting auth initialization...');
      
      try {
        const session = await refreshSession();
        
        if (session?.user && mounted) {
          console.log('Valid session found for user:', session.user.id);
          await fetchAndSetUserProfile(session.user.id);
        } else if (mounted) {
          console.log('No valid session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          console.log('Auth initialization complete');
          setIsInitialized(true);
          isInitializing.current = false;
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== Auth State Change ===');
      console.log('Event:', event);
      console.log('Session exists:', !!session);
      
      if (!mounted) {
        console.log('Component unmounted, ignoring auth change');
        return;
      }

      if (session?.user) {
        console.log('Processing session event for user:', session.user.id);
        await fetchAndSetUserProfile(session.user.id);
        
        // Set up refresh timer when session changes
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const timeUntilExpire = new Date(expiresAt * 1000).getTime() - Date.now();
          const refreshTime = Math.max(0, timeUntilExpire - (5 * 60 * 1000)); // 5 minutes before expiry
          
          if (refreshTimeout.current) {
            clearTimeout(refreshTimeout.current);
          }
          
          refreshTimeout.current = setTimeout(refreshSession, refreshTime);
        }
      } else {
        console.log('No session in auth change event');
        setUser(null);
      }

      // Ensure we're initialized after processing any auth event
      if (!isInitialized) {
        setIsInitialized(true);
      }
    });

    // Start initialization if needed
    if (!isInitialized && !isInitializing.current) {
      initializeAuth().catch(error => {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setIsInitialized(true);
          isInitializing.current = false;
        }
      });
    }

    return () => {
      console.log('=== useAuth Effect Cleanup ===');
      mounted = false;
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, []); // Only run on mount

  return { user, isInitialized };
}
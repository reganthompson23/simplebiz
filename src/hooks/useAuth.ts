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
  const hasInitialized = useRef(false);

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

  // Handle page refresh and visibility
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isInitializing.current) {
        await refreshSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Function to fetch and set user profile
  const fetchAndSetUserProfile = async (userId: string) => {
    if (!userId) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setUser(data as User);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in fetchAndSetUserProfile:', error);
      setUser(null);
      return false;
    }
  };

  // Main auth effect
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || isInitializing.current) return;
      
      console.log('Auth State Change:', event, !!session);
      
      try {
        if (session?.user) {
          await fetchAndSetUserProfile(session.user.id);
          
          // Set up refresh timer
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const timeUntilExpire = new Date(expiresAt * 1000).getTime() - Date.now();
            const refreshTime = Math.max(0, timeUntilExpire - (5 * 60 * 1000));
            
            if (refreshTimeout.current) {
              clearTimeout(refreshTimeout.current);
            }
            
            refreshTimeout.current = setTimeout(refreshSession, refreshTime);
          }
        } else {
          setUser(null);
        }
      } finally {
        if (!hasInitialized.current) {
          setIsInitialized(true);
          hasInitialized.current = true;
        }
      }
    });

    // Initial auth check
    const initializeAuth = async () => {
      if (hasInitialized.current || isInitializing.current) return;
      
      isInitializing.current = true;
      try {
        const session = await refreshSession();
        if (session?.user && mounted) {
          await fetchAndSetUserProfile(session.user.id);
        } else if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsInitialized(true);
          hasInitialized.current = true;
          isInitializing.current = false;
        }
      }
    };

    // Run initial auth check
    initializeAuth();

    return () => {
      mounted = false;
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, []); // Only run on mount

  return { user, isInitialized };
}
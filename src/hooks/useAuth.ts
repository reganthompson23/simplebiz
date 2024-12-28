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
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const timeUntilExpire = new Date(expiresAt * 1000).getTime() - Date.now();
          const refreshTime = Math.max(0, timeUntilExpire - (5 * 60 * 1000));
          
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
    console.log('TEST: Setting up visibility listeners');

    // Basic test listener
    const testVisibility = () => {
      console.log('TEST: Document visibility changed to:', document.visibilityState);
      console.log('TEST: Hidden?', document.hidden);
      console.log('TEST: Active element:', document.activeElement);
    };

    // Add both types of listeners to see which (if any) fire
    document.addEventListener('visibilitychange', testVisibility, false);
    window.addEventListener('blur', () => console.log('TEST: Window blur'), false);
    window.addEventListener('focus', () => console.log('TEST: Window focus'), false);
    
    return () => {
      document.removeEventListener('visibilitychange', testVisibility);
      window.removeEventListener('blur', () => console.log('TEST: Window blur'));
      window.removeEventListener('focus', () => console.log('TEST: Window focus'));
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
  }, []);

  return { user, isInitialized };
}
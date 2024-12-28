import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, setUser, isInitialized, setIsInitialized, cleanup } = useAuthStore();
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);

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
        const { data: { session } } = await supabase.auth.getSession();
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
      subscription.unsubscribe();
    };
  }, []);

  return { user, isInitialized };
}
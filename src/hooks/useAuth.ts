import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, setUser, isInitialized, setIsInitialized } = useAuthStore();
  const isInitializing = useRef(false);

  useEffect(() => {
    let mounted = true;
    console.log('=== useAuth Effect Start ===');
    console.log('Current user state:', user?.id);
    console.log('Is initialized:', isInitialized);

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
        // First check if we have a persisted user
        if (user?.id) {
          console.log('Found persisted user, validating session...');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.id === user.id) {
            console.log('Persisted user matches session, skipping initialization');
            setIsInitialized(true);
            isInitializing.current = false;
            return;
          }
        }

        console.log('Getting session from Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session fetch error:', error);
          throw error;
        }

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
      subscription.unsubscribe();
    };
  }, []); // Only run on mount

  return { user, isInitialized };
}
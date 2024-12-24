import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationPromise = useRef<Promise<void> | null>(null);
  const isInitializing = useRef(false);

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
        console.log('Getting session from Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session fetch error:', error);
          throw error;
        }

        console.log('Session result:', session ? 'Found' : 'Not found');
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
          console.log('Auth initialization complete, setting isInitialized');
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

      // For INITIAL_SESSION, let the initialization handle it
      if (event === 'INITIAL_SESSION') {
        console.log('Received INITIAL_SESSION event, waiting for initialization...');
        if (!isInitialized && !isInitializing.current) {
          await initializeAuth();
        }
        return;
      }

      // For other events, process them directly
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('Processing SIGNED_IN event for user:', session.user.id);
        await fetchAndSetUserProfile(session.user.id);
        if (!isInitialized) {
          setIsInitialized(true);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Processing SIGNED_OUT event');
        setUser(null);
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    });

    // Start initialization
    console.log('Starting auth initialization process...');
    if (!isInitialized && !isInitializing.current) {
      initializationPromise.current = initializeAuth();
      initializationPromise.current.then(() => {
        console.log('Auth initialization promise resolved');
      }).catch(error => {
        console.error('Auth initialization promise rejected:', error);
        // Ensure we still set initialized even on error
        if (mounted) {
          setIsInitialized(true);
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
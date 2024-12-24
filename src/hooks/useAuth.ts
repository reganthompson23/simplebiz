import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Function to fetch and set user profile
    const fetchAndSetUserProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data && mounted) {
          setUser(data as User);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (mounted) setUser(null);
      }
    };

    // Initial session check
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session found:', !!session);
        
        if (session?.user && mounted) {
          console.log('Fetching profile for user:', session.user.id);
          await fetchAndSetUserProfile(session.user.id);
        } else if (mounted) {
          console.log('No session found, clearing user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          console.log('Auth initialization complete');
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, fetching profile');
        await fetchAndSetUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state');
        setUser(null);
      }
    });

    initializeAuth();

    return () => {
      console.log('Cleaning up auth effect');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Only run on mount

  return { user, isInitialized };
}
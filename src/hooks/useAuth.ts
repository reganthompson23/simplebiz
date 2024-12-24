import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // Function to fetch and set user profile
    const fetchAndSetUserProfile = async (userId: string) => {
      try {
        console.log('Fetching user profile for:', userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data && mounted) {
          console.log('Setting user profile:', data);
          setUser(data as User);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (mounted) {
          setUser(null);
        }
      }
    };

    // Initial session check
    const initializeAuth = async () => {
      try {
        console.log('Checking initial session');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          console.log('Found existing session:', session.user.id);
          await fetchAndSetUserProfile(session.user.id);
        } else if (mounted) {
          console.log('No session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setUser(null);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndSetUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setUser]);

  return { user };
}
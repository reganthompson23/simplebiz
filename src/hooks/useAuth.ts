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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && mounted) {
        await fetchAndSetUserProfile(session.user.id);
        // Only redirect to dashboard if we're on the login page
        if (window.location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } else if (mounted && !window.location.pathname.startsWith('/dashboard')) {
        setUser(null);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndSetUserProfile(session.user.id);
        // Only redirect to dashboard if we're on the login page
        if (window.location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Only redirect to login if we're on a protected route
        if (window.location.pathname.startsWith('/dashboard')) {
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setUser]);

  return { user };
}
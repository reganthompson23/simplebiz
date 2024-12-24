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
      console.log('=== Page Load / Refresh ===');
      console.log('1. Checking session...');
      console.log('LocalStorage token:', localStorage.getItem('simplebiz_auth_token'));
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('2. Session found:', session ? 'Yes' : 'No');
      console.log('3. User ID:', session?.user?.id);
      console.log('4. Current path:', window.location.pathname);
      
      if (session?.user && mounted) {
        console.log('5. Found session, fetching profile...');
        await fetchAndSetUserProfile(session.user.id);
        if (window.location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } else if (mounted && !window.location.pathname.startsWith('/dashboard')) {
        console.log('5. No session found, clearing user');
        setUser(null);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== Auth State Change ===');
      console.log('1. Event:', event);
      console.log('2. Session:', session ? 'Yes' : 'No');
      console.log('3. LocalStorage token:', localStorage.getItem('simplebiz_auth_token'));
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('4. Signed in, fetching profile...');
        await fetchAndSetUserProfile(session.user.id);
        if (window.location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('4. Signed out, clearing user');
        setUser(null);
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
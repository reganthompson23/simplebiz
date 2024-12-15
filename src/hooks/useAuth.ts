import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Get the user profile data
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUser(data as User);
            }
          });
      }
    });

    // Set up automatic token refresh
    const {
      data: { subscription: refreshSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (data) {
            setUser(data as User);
          }
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setUser(data as User);
          navigate('/');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      }
    });

    // Set up periodic token refresh
    const refreshInterval = setInterval(() => {
      supabase.auth.refreshSession();
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => {
      refreshSubscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [navigate, setUser]);

  return { user };
}
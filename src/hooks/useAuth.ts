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
    console.log('🔄 useAuth effect running, current user:', user?.id);

    // Function to fetch and set user profile
    const fetchAndSetUserProfile = async (userId: string) => {
      try {
        console.log('📥 Fetching user profile for:', userId);
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('📦 Current session data:', sessionData);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('❌ Error fetching profile:', error);
          throw error;
        }
        
        if (data && mounted) {
          console.log('✅ Setting user profile:', data);
          setUser(data as User);
        } else {
          console.error('❌ No profile data found');
          throw new Error('No profile data found');
        }
      } catch (error) {
        console.error('❌ Error in fetchAndSetUserProfile:', error);
        if (mounted) {
          setUser(null);
          navigate('/login', { replace: true });
        }
      }
    };

    // Initial session check
    const initializeAuth = async () => {
      try {
        console.log('🔍 Checking initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('📦 Initial session:', session?.user?.id);
        
        if (error) {
          console.error('❌ Session check error:', error);
          throw error;
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session:', session.user.id);
          await fetchAndSetUserProfile(session.user.id);
          // Only navigate if we're not already on the dashboard
          if (!window.location.pathname.startsWith('/dashboard')) {
            navigate('/dashboard', { replace: true });
          }
        } else if (mounted) {
          console.log('ℹ️ No session found');
          setUser(null);
          // Only navigate if we're not already on the login page
          if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ Error in initializeAuth:', error);
        if (mounted) {
          setUser(null);
          navigate('/login', { replace: true });
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    console.log('🎧 Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event);
      console.log('📦 Session in state change:', session?.user?.id);
      if (!mounted) {
        console.log('⚠️ Component unmounted, ignoring auth change');
        return;
      }

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎯 Processing SIGNED_IN event for user:', session.user.id);
          await fetchAndSetUserProfile(session.user.id);
          // Only navigate if we're not already on the dashboard
          if (!window.location.pathname.startsWith('/dashboard')) {
            navigate('/dashboard', { replace: true });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Processing SIGNED_OUT event');
          setUser(null);
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        if (mounted) {
          setUser(null);
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up useAuth effect');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setUser]);

  return { user };
}
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
        } else {
          console.log('No profile data found');
        }
      } catch (error) {
        console.error('Error in fetchAndSetUserProfile:', error);
        if (mounted) {
          console.log('Setting user to null due to error');
          setUser(null);
        }
      }
    };

    // Initial session check
    const initializeAuth = async () => {
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

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('Processing SIGNED_IN event for user:', session.user.id);
        await fetchAndSetUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('Processing SIGNED_OUT event');
        setUser(null);
      }
    });

    // Start initialization
    console.log('Starting auth initialization process...');
    initializeAuth().then(() => {
      console.log('Auth initialization promise resolved');
    }).catch(error => {
      console.error('Auth initialization promise rejected:', error);
    });

    return () => {
      console.log('=== useAuth Effect Cleanup ===');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Only run on mount

  return { user, isInitialized };
}
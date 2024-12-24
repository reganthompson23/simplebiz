import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isInitialized: boolean;
  setIsInitialized: (isInitialized: boolean) => void;
  cleanup: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      isInitialized: false,
      setIsInitialized: (isInitialized) => set({ isInitialized }),
      cleanup: async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();
        // Clear our store
        set({ user: null, isInitialized: false });
        // Clear localStorage
        localStorage.clear();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user data
    }
  )
);
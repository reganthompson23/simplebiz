import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error(
    'Supabase configuration is incomplete. ' +
    'Please make sure you have set up your .env file correctly with ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'sb-' + config.supabase.url.split('//')[1].split('.')[0] + '-auth-token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-client-info': 'simplebiz'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 1
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Add reconnection handler with more frequent checks
let reconnectTimeout: NodeJS.Timeout;
let lastActiveTimestamp = Date.now();

// Track user activity
const updateLastActive = () => {
  lastActiveTimestamp = Date.now();
};

// Add activity listeners
window.addEventListener('mousemove', updateLastActive);
window.addEventListener('keydown', updateLastActive);
window.addEventListener('click', updateLastActive);
window.addEventListener('scroll', updateLastActive);
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateLastActive();
  }
});

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    // Clear any existing timeout
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    
    // Set up reconnection check
    const checkConnection = async () => {
      try {
        // Only check connection if user has been active in the last 30 minutes
        if (Date.now() - lastActiveTimestamp < 30 * 60 * 1000) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            // If no session, try to reconnect
            await supabase.auth.refreshSession();
          }
          // Ensure realtime connection
          if (!supabase.realtime.isConnected()) {
            await supabase.realtime.connect();
          }
        }
      } catch (error) {
        console.error('Connection check error:', error);
      }
      // Schedule next check - more frequent checks (every 15 seconds)
      reconnectTimeout = setTimeout(checkConnection, 15000);
    };
    
    // Start checking
    checkConnection();
  }
});
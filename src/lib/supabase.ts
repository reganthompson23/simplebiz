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

// Add reconnection handler
let reconnectTimeout: NodeJS.Timeout;

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    // Clear any existing timeout
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    
    // Set up reconnection check
    const checkConnection = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // If no session, try to reconnect
          await supabase.auth.refreshSession();
        }
      } catch (error) {
        console.error('Connection check error:', error);
      }
      // Schedule next check
      reconnectTimeout = setTimeout(checkConnection, 30000); // Check every 30 seconds
    };
    
    // Start checking
    checkConnection();
  }
});
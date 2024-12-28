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

// Track connection state
let isConnected = false;

// Function to ensure connection
const ensureConnection = async () => {
  try {
    if (!isConnected) {
      await supabase.realtime.connect();
      isConnected = true;
    }
  } catch (error) {
    console.error('Connection error:', error);
    isConnected = false;
  }
};

// Handle connection state changes
const channel = supabase.channel('system');
channel
  .on('system', { event: 'presence_state' }, () => {
    isConnected = true;
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      isConnected = true;
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      isConnected = false;
      // Try to reconnect
      ensureConnection();
    }
  });

// Handle visibility changes
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    // Reset connection state
    isConnected = false;
    // Force a new connection
    await ensureConnection();
    
    // Get a fresh session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Refresh the session
      await supabase.auth.refreshSession();
    }
  }
});

// Initial connection
ensureConnection();

// Export connection check function for use in components
export const checkConnection = async () => {
  await ensureConnection();
  return isConnected;
};
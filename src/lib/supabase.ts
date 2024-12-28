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

// Initialize realtime connection
const channel = supabase.channel('system');

channel
  .on('system', { event: 'connected' }, () => {
    console.log('Realtime connected');
  })
  .on('system', { event: 'disconnected' }, () => {
    console.log('Realtime disconnected');
    // Attempt to reconnect
    setTimeout(() => {
      supabase.realtime.connect();
    }, 1000);
  })
  .subscribe();

// Initialize connection
supabase.realtime.connect();

// Export connection check function for use in components
export const checkConnection = async () => {
  const isConnected = supabase.realtime.isConnected();
  if (!isConnected) {
    await supabase.realtime.connect();
  }
  return supabase.realtime.isConnected();
};
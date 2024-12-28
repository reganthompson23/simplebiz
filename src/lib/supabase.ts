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
    console.log('Supabase realtime connected, channel:', channel.state);
  })
  .on('system', { event: 'disconnected' }, () => {
    console.log('Supabase realtime disconnected, channel:', channel.state);
    // Attempt to reconnect
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      supabase.realtime.connect();
    }, 1000);
  })
  .subscribe((status) => {
    console.log('Channel subscription status:', status);
  });

// Initialize connection
console.log('Initializing Supabase realtime connection...');
supabase.realtime.connect();

// Export connection check function for use in components
export const checkConnection = async () => {
  const isConnected = supabase.realtime.isConnected();
  console.log('Connection check:', isConnected);
  if (!isConnected) {
    console.log('Not connected, attempting to connect...');
    await supabase.realtime.connect();
  }
  return supabase.realtime.isConnected();
};
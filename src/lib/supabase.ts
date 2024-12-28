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
      },
      reconnectAfterMs: (retries: number) => Math.min(1000 * (retries + 1), 10000),
      timeout: 60000
    },
    db: {
      schema: 'public'
    }
  }
);

// Initialize realtime connection
const channel = supabase.channel('system');

// Keep track of reconnection attempts
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const connect = () => {
  console.log('Connecting to Supabase realtime...');
  supabase.realtime.connect();
  reconnectAttempts = 0;
};

const scheduleReconnect = () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('Max reconnection attempts reached, giving up');
    return;
  }
  
  const delay = Math.min(1000 * (2 ** reconnectAttempts), 10000);
  console.log(`Scheduling reconnect attempt ${reconnectAttempts + 1} in ${delay}ms`);
  
  setTimeout(() => {
    reconnectAttempts++;
    connect();
  }, delay);
};

channel
  .on('system', { event: 'connected' }, () => {
    console.log('Supabase realtime connected, channel:', channel.state);
    reconnectAttempts = 0;
  })
  .on('system', { event: 'disconnected' }, () => {
    console.log('Supabase realtime disconnected, channel:', channel.state);
    scheduleReconnect();
  })
  .subscribe((status) => {
    console.log('Channel subscription status:', status);
    if (status === 'SUBSCRIBED') {
      reconnectAttempts = 0;
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      scheduleReconnect();
    }
  });

// Initialize connection
connect();

// Export connection check function for use in components
export const checkConnection = async () => {
  const isConnected = supabase.realtime.isConnected();
  console.log('Connection check:', isConnected);
  if (!isConnected) {
    connect();
  }
  return supabase.realtime.isConnected();
};
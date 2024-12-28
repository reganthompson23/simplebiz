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
      flowType: 'pkce',
      debug: true
    },
    global: {
      headers: {
        'x-client-info': 'simplebiz'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      },
      timeout: 120000,
      reconnectAfterMs: (retries: number) => {
        const delay = Math.min(500 * Math.pow(2, retries), 5000);
        console.log(`Supabase reconnecting in ${delay}ms (attempt ${retries + 1})`);
        return delay;
      }
    },
    db: {
      schema: 'public'
    }
  }
);

let isReconnecting = false;

const channel = supabase.channel('system');

channel
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Supabase realtime connected');
      isReconnecting = false;
    }
    if (status === 'CLOSED') {
      console.log('Supabase realtime disconnected');
      if (!isReconnecting) {
        isReconnecting = true;
        setTimeout(() => {
          console.log('Forcing Supabase realtime reconnection');
          channel.subscribe();
          isReconnecting = false;
        }, 1000);
      }
    }
  });

export const checkConnection = () => {
  const isConnected = supabase.realtime.isConnected();
  console.log('Supabase realtime connection status:', isConnected);
  if (!isConnected && !isReconnecting) {
    console.log('Connection lost, attempting to reconnect...');
    channel.subscribe();
  }
  return isConnected;
};
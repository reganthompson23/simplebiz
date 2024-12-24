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
      storageKey: 'sb-' + config.supabase.url.split('//')[1].split('.')[0] + '-auth-token'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'x-client-info': 'simplebiz'
      }
    }
  }
);
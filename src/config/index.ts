import { env } from './env';
import { supabaseConfig } from './supabase';

export const config = {
  env,
  supabase: supabaseConfig,
  
  // Add other configuration sections as needed
  app: {
    name: 'SimpleBiz',
    version: '1.0.0',
  },
};
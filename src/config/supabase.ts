import { env } from './env';

export const supabaseConfig = {
  url: env.supabase.url,
  anonKey: env.supabase.anonKey,
  
  // Add any Supabase-specific configuration here
  tables: {
    profiles: 'profiles',
    leads: 'leads',
    invoices: 'invoices',
    expenses: 'expenses',
    schedules: 'schedules',
  },
};
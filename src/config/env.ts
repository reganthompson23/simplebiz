// Environment variable validation and access
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  
  if (!value && typeof defaultValue === 'undefined') {
    throw new Error(
      `Environment variable ${key} is required but not set. ` +
      `Please check your .env file.`
    );
  }
  
  return value || defaultValue || '';
};

export const env = {
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  mode: getEnvVar('MODE', 'development'),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { checkConnection } from './lib/supabase';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Handle connection changes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // Keep data fresh
      staleTime: 60000, // Consider data fresh for 60 seconds
      gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
      
      // Custom retry logic
      retryOnMount: true
    },
  },
});

// Add connection check on focus/reconnect
window.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    await checkConnection();
    // Invalidate all queries to force a refresh
    queryClient.invalidateQueries();
  }
});

// Add connection check on mount
if (document.visibilityState === 'visible') {
  checkConnection();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

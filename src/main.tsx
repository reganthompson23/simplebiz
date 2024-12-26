import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // Keep data fresh
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
      
      // Ensure queries refetch when coming back to tab
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

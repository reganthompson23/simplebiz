import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // More conservative refetch settings
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      refetchOnReconnect: true,
      
      // Keep data fresh
      staleTime: 60000, // Consider data fresh for 60 seconds
      gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
      
      // Disable background refetching
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

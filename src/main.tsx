import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Handle connection changes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      
      // Keep data fresh
      staleTime: 60000, // Consider data fresh for 60 seconds
      gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
      
      // Custom retry logic
      retryOnMount: true
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

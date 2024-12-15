import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import AuthCallback from './components/auth/AuthCallback';
import WebsiteBuilder from './features/website/WebsiteBuilder';
import LeadsList from './features/crm/LeadsList';
import InvoiceList from './features/invoicing/InvoiceList';
import ExpenseList from './features/expenses/ExpenseList';
import ScheduleView from './features/schedule/ScheduleView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data stays fresh for 30 seconds
      cacheTime: 5 * 60 * 1000, // Cache data for 5 minutes
      retry: 1, // Only retry once
      retryDelay: 1000, // Wait 1 second before retrying
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/sitebuilder" />} />
            <Route path="sitebuilder" element={<WebsiteBuilder />} />
            <Route path="inquiries" element={<LeadsList />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="schedule" element={<ScheduleView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
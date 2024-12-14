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
      staleTime: 0, // Consider all data stale immediately
      cacheTime: 0, // Don't cache any data
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
            <Route path="crm" element={<LeadsList />} />
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
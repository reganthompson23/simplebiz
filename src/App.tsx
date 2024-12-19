import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/Layout';
import WebsiteBuilder from './features/website/WebsiteBuilder';
import InvoiceList from './features/invoicing/InvoiceList';
import CreateInvoice from './features/invoicing/CreateInvoice';
import LeadsList from './features/crm/LeadsList';
import ExpenseList from './features/expenses/ExpenseList';
import ExpenseForm from './features/expenses/ExpenseForm';
import ScheduleListV2 from './features/schedule/ScheduleListV2';
import ScheduleForm from './features/schedule/ScheduleForm';
import ScheduleFormV2 from './features/schedule/ScheduleFormV2';
import ProtectedRoute from './components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="website" element={<WebsiteBuilder />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/new" element={<CreateInvoice />} />
            <Route path="invoices/:id/edit" element={<CreateInvoice />} />
            <Route path="inquiries" element={<LeadsList />} />
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="expenses/new" element={<ExpenseForm />} />
            <Route path="expenses/:id/edit" element={<ExpenseForm />} />
            <Route path="schedule" element={<ScheduleListV2 />} />
            <Route path="schedule/new-v2" element={<ScheduleFormV2 />} />
            <Route path="schedule/edit/:id" element={<ScheduleForm />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
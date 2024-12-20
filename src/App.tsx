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
import Expenses2List from './features/expenses2/Expenses2List';
import Expenses2Form from './features/expenses2/Expenses2Form';
import ScheduleList from './features/schedule/ScheduleList';
import ScheduleForm from './features/schedule/ScheduleForm';
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
            <Route path="expenses2" element={<Expenses2List />} />
            <Route path="expenses2/new" element={<Expenses2Form />} />
            <Route path="expenses2/:id/edit" element={<Expenses2Form />} />
            <Route path="schedule" element={<ScheduleList />} />
            <Route path="schedule/new" element={<ScheduleForm />} />
            <Route path="schedule/:id/edit" element={<ScheduleForm />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
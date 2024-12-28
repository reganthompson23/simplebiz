import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/Layout';
import HomePage from './features/home/HomePage';
import WebsiteBuilder from './features/website/WebsiteBuilder';
import InvoiceList from './features/invoicing/InvoiceList';
import CreateInvoice from './features/invoicing/CreateInvoice';
import LeadsList from './features/crm/LeadsList';
import ExpenseList from './features/expenses/ExpenseList';
import ExpenseForm from './features/expenses/ExpenseForm';
import ScheduleList from './features/schedule/ScheduleList';
import ScheduleForm from './features/schedule/ScheduleForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ViewInvoice from './features/invoicing/ViewInvoice';
import CustomerWebsite from './features/website/CustomerWebsite';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="website" element={<WebsiteBuilder />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<ViewInvoice />} />
          <Route path="invoices/:id/edit" element={<CreateInvoice />} />
          <Route path="inquiries" element={<LeadsList />} />
          <Route path="expenses" element={<ExpenseList />} />
          <Route path="expenses/new" element={<ExpenseForm />} />
          <Route path="expenses/:id/edit" element={<ExpenseForm />} />
          <Route path="schedule" element={<ScheduleList />} />
          <Route path="schedule/new" element={<ScheduleForm />} />
          <Route path="schedule/:id/edit" element={<ScheduleForm />} />
          <Route index element={<Navigate to="website" replace />} />
        </Route>
        <Route path="/:businessPath" element={<CustomerWebsite />} />
      </Routes>
    </Router>
  );
}

export default App;
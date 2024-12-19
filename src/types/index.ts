export interface User {
  id: string;
  email: string;
  businessName: string;
  businessAddress?: string;
  phone?: string;
  abn?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  status: 'new' | 'in_progress' | 'converted' | 'lost';
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  profile_id: string;
  invoice_number: string;
  from_details: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    abn?: string;
  } | string;
  to_details: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    abn?: string;
  } | string;
  payment_terms?: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  tax_rate: number;
  total: number;
  notes?: string;
  terms?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}
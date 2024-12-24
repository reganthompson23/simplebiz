export interface User {
  id: string;
  contact_email: string;
  business_name: string;
  contact_phone?: string;
  address?: string;
  abn?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'open' | 'closed' | 'lost';
  notes?: string;
  source?: string;
  created_at: string;
  updated_at: string;
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

export interface Schedule {
  id: string;
  profile_id: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  job_description: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleFormData {
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  job_description: string;
}
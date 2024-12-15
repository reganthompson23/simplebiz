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
  profileId: string;
  invoiceNumber: string;
  fromDetails: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    abn?: string;
  };
  toDetails: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    abn?: string;
  };
  paymentTerms?: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxRate: number;
  total: number;
  notes?: string;
  terms?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
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

export interface ScheduleEntry {
  id: string;
  userId: string;
  customerName: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  createdAt: string;
}
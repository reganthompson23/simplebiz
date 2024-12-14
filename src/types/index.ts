export interface User {
  id: string;
  email: string;
  businessName: string;
  businessAddress?: string;
  phone?: string;
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
  userId: string;
  clientName: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'paid' | 'unpaid';
  createdAt: string;
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
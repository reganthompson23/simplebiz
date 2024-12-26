import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutGrid,
  Users,
  FileText,
  DollarSign,
  LogOut,
  Calendar,
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ensureConnection } = useAuth();

  const handleSignOut = async () => {
    try {
      await ensureConnection();
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // If sign out fails, force a page refresh as fallback
      window.location.href = '/login';
    }
  };

  const navigation = [
    { name: 'Website', href: '/dashboard/website', icon: LayoutGrid },
    { name: 'Inquiries', href: '/dashboard/inquiries', icon: Users },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { name: 'Expenses', href: '/dashboard/expenses', icon: DollarSign },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">litebiz</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
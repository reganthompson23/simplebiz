import React from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, FileText, Users, DollarSign, Calendar } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/website', label: 'Website', icon: LayoutGrid },
    { path: '/invoices', label: 'Invoices', icon: FileText },
    { path: '/inquiries', label: 'Inquiries', icon: Users },
    { path: '/expenses', label: 'Expenses', icon: DollarSign },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">SimpleBiz</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 
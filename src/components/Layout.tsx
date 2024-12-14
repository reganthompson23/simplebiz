import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  Calendar,
  LogOut,
  Menu
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const navItems = [
  { path: '/', icon: Home, label: 'Website' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/invoices', icon: FileText, label: 'Invoices' },
  { path: '/expenses', icon: DollarSign, label: 'Expenses' },
  { path: '/schedule', icon: Calendar, label: 'Schedule' },
];

export default function Layout() {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, setUser } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold">SimpleBiz</h1>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static transition-transform duration-200 ease-in-out
      `}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold text-gray-800">SimpleBiz</h1>
            {user && (
              <p className="text-sm text-gray-600 mt-1">{user.businessName}</p>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="max-w-7xl mx-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
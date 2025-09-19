import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package,
  BarChart3,
  ShoppingCart,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: ('superadmin' | 'admin' | 'user')[];
}

const navigation: NavigationItem[] = [
  { name: 'Vendas', href: '/', icon: ShoppingCart },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Usuários', href: '/usuarios', icon: Users, roles: ['superadmin'] },
  { name: 'Logs', href: '/logs', icon: FileText, roles: ['superadmin', 'admin'] },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mascate-50 via-white to-nightclub-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-mascate-500 to-mascate-600">
            <div className="flex items-center space-x-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Mascate Runeria</h1>
                <p className="text-xs text-mascate-100">Controle de Caixa</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map(item => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-mascate-500 to-mascate-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-mascate-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 bg-mascate-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-mascate-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-mascate-900">{user?.username}</p>
                  <p className="text-sm text-mascate-600">
                    {user?.role === 'superadmin' && 'Super Admin'}
                    {user?.role === 'admin' && 'Admin'}
                    {user?.role === 'user' && 'Usuário'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2"
                onClick={handleLogout}
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <h2 className="font-semibold text-gray-900">Mascate Runeria</h2>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
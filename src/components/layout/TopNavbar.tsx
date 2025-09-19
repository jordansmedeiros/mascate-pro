import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  ScrollText,
  Settings,
  LogOut,
  User
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  requiresRole?: 'admin' | 'superadmin';
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/',
    label: 'Vendas',
    icon: ShoppingCart,
  },
  {
    to: '/produtos',
    label: 'Produtos',
    icon: Package,
  },
  {
    to: '/usuarios',
    label: 'Usuários',
    icon: Users,
    requiresRole: 'superadmin',
  },
  {
    to: '/logs',
    label: 'Logs',
    icon: ScrollText,
    requiresRole: 'admin',
  },
  {
    to: '/configuracoes',
    label: 'Config',
    icon: Settings,
  },
];

export const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => {
    if (!item.requiresRole) return true;
    
    if (!user) return false;
    
    const roleHierarchy = { 'user': 1, 'admin': 2, 'superadmin': 3 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[item.requiresRole];
    
    return userLevel >= requiredLevel;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-500 text-white';
      case 'admin': return 'bg-blue-500 text-white';
      case 'user': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'SuperAdmin';
      case 'admin': return 'Admin';
      case 'user': return 'Usuário';
      default: return role;
    }
  };

  return (
    <nav className="bg-mascate-red shadow-md border-b-2 border-mascate-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo e Nome */}
          <div className="flex items-center space-x-3">
            <div className="bg-mascate-yellow p-2 rounded-lg shadow-sm">
              <Package className="h-6 w-6 text-mascate-green" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-wide">
                MASCATE
              </h1>
              <p className="text-gray-200 text-xs -mt-1">
                Controle de Estoque
              </p>
            </div>
          </div>

          {/* Menu de Navegação Central */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isActive
                          ? 'bg-mascate-yellow text-mascate-green shadow-md'
                          : 'text-white hover:bg-white/10 hover:text-mascate-yellow'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Área do usuário */}
          <div className="flex items-center space-x-3">
            {/* Info do usuário */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-white font-medium text-sm">
                {user?.username}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full inline-block w-fit ml-auto ${getRoleColor(user?.role || '')}`}>
                {getRoleLabel(user?.role || '')}
              </span>
            </div>

            {/* Avatar do usuário */}
            <div className="bg-mascate-yellow p-2 rounded-full">
              <User className="h-5 w-5 text-mascate-green" />
            </div>

            {/* Botão de logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10 hover:text-mascate-yellow border border-white/20"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Menu mobile */}
        <div className="md:hidden pb-3">
          <div className="flex flex-wrap gap-1 pt-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                      isActive
                        ? 'bg-mascate-yellow text-mascate-green'
                        : 'text-white hover:bg-white/10 hover:text-mascate-yellow'
                    }`
                  }
                >
                  <Icon className="h-3 w-3" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
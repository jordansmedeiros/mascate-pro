import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getAvatarIcon } from '@/constants/avatars';
import { 
  LayoutDashboard, 
  Package,
  ShoppingCart, 
  Users, 
  ScrollText,
  Settings,
  LogOut,
  ChevronDown,
  UserCircle,
  Key
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false);
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


  return (
    <nav className="bg-mascate-red shadow-md border-b-2 border-mascate-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/image.png" 
              alt="Mascate Logo" 
              className="h-12 w-auto" 
            />
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

          {/* Área do usuário com Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {/* Botão do usuário */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all duration-200"
            >
              {/* Info do usuário */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-medium text-sm">
                  {user?.displayName || user?.username}
                </span>
              </div>

              {/* Avatar do usuário */}
              <div className="bg-mascate-yellow p-2 rounded-full text-xl">
                {getAvatarIcon(user?.avatarId)}
              </div>

              {/* Ícone dropdown */}
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.displayName || user?.username}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                
                <Link
                  to="/perfil"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="h-4 w-4" />
                  <span>Meu Perfil</span>
                </Link>
                
                <Link
                  to="/alterar-senha"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Key className="h-4 w-4" />
                  <span>Alterar Senha</span>
                </Link>
                
                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
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
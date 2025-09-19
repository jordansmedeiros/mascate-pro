import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { ProdutosPage } from '@/features/products/components/ProdutosPage';
import { EstoquePage } from '@/features/stock/components/EstoquePage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Protected Route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'superadmin' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Verificando autenticação..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      'user': 1,
      'admin': 2,
      'superadmin': 3,
    };

    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return (
        <AppLayout>
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-red-800 mb-2">Acesso Negado</h2>
              <p className="text-red-600">
                Você não tem permissão para acessar esta página.
              </p>
              <p className="text-sm text-red-500 mt-2">
                Necessário: {requiredRole} | Seu nível: {user.role}
              </p>
            </div>
          </div>
        </AppLayout>
      );
    }
  }

  return <>{children}</>;
};

// Temporary placeholder components for routes not yet implemented
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center py-12">
    <div className="bg-mascate-50 border border-mascate-200 rounded-xl p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-mascate-800 mb-2">{title}</h2>
      <p className="text-mascate-600 mb-4">Esta página está sendo implementada.</p>
      <p className="text-sm text-mascate-500">
        🚧 Em breve você poderá acessar todas as funcionalidades!
      </p>
    </div>
  </div>
);

// Main app routes
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route - Login */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <LoginForm />} 
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EstoquePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProdutosPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/estoque"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EstoquePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute requiredRole="superadmin">
            <AppLayout>
              <ComingSoon title="👥 Gestão de Usuários" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/logs"
        element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <ComingSoon title="📋 Logs de Atividade" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ComingSoon title="⚙️ Configurações" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
};

export default App;

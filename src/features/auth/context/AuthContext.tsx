import React, { createContext, useEffect, useState } from 'react';
import type { User } from '@/types';
import { getDatabase } from '@/services/db';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 AuthContext: Verificando sessão existente...');
        const savedUser = localStorage.getItem('mascate_current_user');

        if (savedUser) {
          console.log('📱 AuthContext: Sessão encontrada no localStorage');
          const userData = JSON.parse(savedUser);
          console.log('👤 AuthContext: Dados do usuário:', { id: userData.id, email: userData.email });

          // Verify user still exists and is active
          const db = await getDatabase();
          console.log('🔗 AuthContext: Conectado ao banco, verificando usuário...');
          const currentUser = await db.getUserById(userData.id);

          if (currentUser && currentUser.active) {
            console.log('✅ AuthContext: Usuário válido encontrado, restaurando sessão');

            // Update last login
            await db.updateUser(currentUser.id, {
              last_login: new Date().toISOString(),
            });

            // Log the session restoration
            await db.createActivityLog({
              user_id: currentUser.id,
              action: 'SESSION_RESTORED',
              details: `Sessão restaurada para usuário ${currentUser.displayName} (${currentUser.email})`,
              ip_address: '127.0.0.1',
              user_agent: navigator.userAgent,
            });

            setUser(currentUser);
            console.log('🎉 AuthContext: Sessão restaurada com sucesso!');
          } else {
            console.log('❌ AuthContext: Usuário não encontrado ou inativo, removendo sessão');
            localStorage.removeItem('mascate_current_user');
          }
        } else {
          console.log('📭 AuthContext: Nenhuma sessão encontrada no localStorage');
        }
      } catch (error) {
        console.error('❌ AuthContext: Erro ao verificar sessão existente:', error);
        localStorage.removeItem('mascate_current_user');
      } finally {
        setIsLoading(false);
        console.log('⏹️ AuthContext: Verificação de sessão concluída');
      }
    };

    checkExistingSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Iniciando login para:', email);
      const db = await getDatabase();

      // Use the new authentication endpoint with proper password hashing
      const result = await db.login(email, password);

      if (result.success && result.user) {
        console.log('✅ AuthContext: Login bem-sucedido, salvando sessão');
        // Save to localStorage and state
        localStorage.setItem('mascate_current_user', JSON.stringify(result.user));
        setUser(result.user);
        console.log('💾 AuthContext: Sessão salva no localStorage');
      } else {
        console.log('❌ AuthContext: Falha no login:', result.error);
        return { success: false, error: result.error || 'Credenciais inválidas' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: Erro no login:', error);
      return { success: false, error: 'Erro interno do sistema. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (user) {
        console.log('🔄 AuthContext: Atualizando dados do usuário...');
        const db = await getDatabase();
        const currentUser = await db.getUserById(user.id);

        if (currentUser && currentUser.active) {
          console.log('✅ AuthContext: Dados do usuário atualizados');
          setUser(currentUser);
          localStorage.setItem('mascate_current_user', JSON.stringify(currentUser));
        } else {
          console.log('❌ AuthContext: Usuário não encontrado ou inativo, fazendo logout');
          await logout();
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Erro ao atualizar dados do usuário:', error);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        const db = await getDatabase();

        // Log the logout
        await db.createActivityLog({
          user_id: user.id,
          action: 'LOGOUT',
          details: `Logout realizado para usuário ${user.displayName} (${user.email})`,
          ip_address: '127.0.0.1',
          user_agent: navigator.userAgent,
        });
      }
    } catch (error) {
      console.error('Error logging logout:', error);
    } finally {
      // Clear session data
      localStorage.removeItem('mascate_current_user');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    refreshUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
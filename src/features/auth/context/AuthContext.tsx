import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';
import { getDatabase } from '@/services/db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
        const savedUser = localStorage.getItem('mascate_current_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Verify user still exists and is active
          const db = await getDatabase();
          const currentUser = await db.getUserById(userData.id);
          
          if (currentUser && currentUser.active) {
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
          } else {
            // User no longer exists or is inactive
            localStorage.removeItem('mascate_current_user');
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        localStorage.removeItem('mascate_current_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const db = await getDatabase();
      
      // Use the new authentication endpoint with proper password hashing
      const result = await db.login(email, password);

      if (result.success && result.user) {
        // Save to localStorage and state
        localStorage.setItem('mascate_current_user', JSON.stringify(result.user));
        setUser(result.user);
        setIsAuthenticated(true);
      } else {
        return { success: false, error: result.error || 'Credenciais inválidas' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro interno do sistema. Tente novamente.' };
    } finally {
      setIsLoading(false);
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
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
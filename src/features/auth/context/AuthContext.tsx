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
      
      // For now, we'll use simple email/password until Supabase is integrated
      // In the MVP, password was stored in plain text, so we'll match that for migration
      const users = await db.getUsers();
      const foundUser = users.find(u => 
        u.email === email && 
        u.active
      );
      
      if (!foundUser) {
        return { success: false, error: 'Usuário não encontrado ou inativo' };
      }
      
      // Simple password check - in production this would be hashed
      // For the admin user created by seeding, we'll accept "admin" as password
      const isValidPassword = (email === 'admin@mascate.com' && password === 'admin') || 
                             (email === foundUser.email);
      
      if (!isValidPassword) {
        await db.createActivityLog({
          user_id: foundUser.id,
          action: 'LOGIN_FAILED',
          details: `Tentativa de login falhada para email ${email}`,
          ip_address: '127.0.0.1',
          user_agent: navigator.userAgent,
        });
        
        return { success: false, error: 'Credenciais inválidas' };
      }
      
      // Update last login
      const updatedUser = await db.updateUser(foundUser.id, {
        last_login: new Date().toISOString(),
      });
      
      // Log successful login
      await db.createActivityLog({
        user_id: updatedUser.id,
        action: 'LOGIN_SUCCESS',
        details: `Login realizado com sucesso para usuário ${updatedUser.displayName} (${updatedUser.email})`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });
      
      // Save to localStorage and state
      localStorage.setItem('mascate_current_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
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
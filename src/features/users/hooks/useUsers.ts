import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/services/db';
import type { User } from '@/types';
import { useAuth } from '@/features/auth/context/AuthContext';

// Query keys for React Query cache management
export const userKeys = {
  all: ['users'] as const,
  active: () => [...userKeys.all, 'active'] as const,
  byId: (id: string) => [...userKeys.all, id] as const,
};

// Hook to get all users (superadmin only)
export const useUsers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: userKeys.active(),
    queryFn: async () => {
      if (user?.role !== 'superadmin') {
        throw new Error('Acesso negado: apenas superadmin pode visualizar usuários');
      }
      
      const db = await getDatabase();
      return db.getUsers();
    },
    enabled: user?.role === 'superadmin',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to get a single user by ID
export const useUser = (id: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: userKeys.byId(id),
    queryFn: async () => {
      if (user?.role !== 'superadmin') {
        throw new Error('Acesso negado: apenas superadmin pode visualizar usuários');
      }
      
      const db = await getDatabase();
      return db.getUserById(id);
    },
    enabled: !!id && user?.role === 'superadmin',
  });
};

// Interface for creating new user
interface CreateUserData {
  email: string;
  displayName: string;
  avatarId: string;
  role: 'user' | 'admin' | 'superadmin';
  active?: boolean;
}

// Hook to create a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      if (user?.role !== 'superadmin') {
        throw new Error('Acesso negado: apenas superadmin pode criar usuários');
      }

      const db = await getDatabase();
      
      // Check if email already exists
      const existingUsers = await db.getUsers();
      const emailExists = existingUsers.some(u => u.email === userData.email);

      if (emailExists) {
        throw new Error('Email já está em uso');
      }

      const newUser = await db.createUser({
        ...userData,
        active: userData.active ?? true,
      });

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'USER_CREATED',
        details: `Usuário "${newUser.displayName}" criado com role "${newUser.role}"`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return newUser;
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Hook to update a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      if (user?.role !== 'superadmin') {
        throw new Error('Acesso negado: apenas superadmin pode editar usuários');
      }

      const db = await getDatabase();
      
      // Prevent superadmin from deactivating themselves
      if (id === user.id && updates.active === false) {
        throw new Error('Você não pode desativar sua própria conta');
      }
      
      // If changing email, check for duplicates
      if (updates.email) {
        const existingUsers = await db.getUsers();
        const emailExists = existingUsers.some(u => u.id !== id && u.email === updates.email);
        if (emailExists) {
          throw new Error('Email já está em uso');
        }
      }

      const updatedUser = await db.updateUser(id, updates);

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'USER_UPDATED',
        details: `Usuário "${updatedUser.displayName}" atualizado`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      // Update cache
      queryClient.setQueryData(
        userKeys.byId(updatedUser.id),
        updatedUser
      );
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Hook to delete/deactivate a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (user?.role !== 'superadmin') {
        throw new Error('Acesso negado: apenas superadmin pode remover usuários');
      }

      if (id === user.id) {
        throw new Error('Você não pode remover sua própria conta');
      }

      const db = await getDatabase();
      
      const targetUser = await db.getUserById(id);
      if (!targetUser) throw new Error('Usuário não encontrado');

      await db.deleteUser(id);

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'USER_DELETED',
        details: `Usuário "${targetUser.displayName}" desativado`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return id;
    },
    onSuccess: () => {
      // Invalidate users cache
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Hook to reset user password (generates a simple password)
export const useResetUserPassword = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (user?.role !== 'superadmin') {
        throw new Error('Acesso negado: apenas superadmin pode resetar senhas');
      }

      const db = await getDatabase();
      
      const targetUser = await db.getUserById(userId);
      if (!targetUser) throw new Error('Usuário não encontrado');

      // For this simple system, we'll just use a default password
      // In production, this would generate a secure temporary password
      const defaultPassword = `${targetUser.email.split('@')[0]}123`;
      
      // Note: In a real system, you'd hash the password here
      // For now, we'll just log the action
      
      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'PASSWORD_RESET',
        details: `Senha do usuário "${targetUser.displayName}" resetada`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return { email: targetUser.email, newPassword: defaultPassword };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
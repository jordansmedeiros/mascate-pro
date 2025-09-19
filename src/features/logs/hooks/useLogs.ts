import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '@/services/db';
import { useAuth } from '@/features/auth/context/AuthContext';

// Query keys for React Query cache management
export const logKeys = {
  all: ['logs'] as const,
  filtered: (filters: LogFilters) => [...logKeys.all, 'filtered', filters] as const,
  byUser: (userId: string) => [...logKeys.all, 'by-user', userId] as const,
  byDateRange: (startDate: string, endDate: string) => [...logKeys.all, 'by-date', startDate, endDate] as const,
};

// Interface for log filtering
export interface LogFilters {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Hook to get all activity logs (admin+ only)
export const useLogs = (filters: LogFilters = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: logKeys.filtered(filters),
    queryFn: async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        throw new Error('Acesso negado: apenas admins podem visualizar logs');
      }
      
      const db = await getDatabase();
      let logs = await db.getActivityLogs();
      
      // Apply filters
      if (filters.userId) {
        logs = logs.filter(log => log.user_id === filters.userId);
      }
      
      if (filters.action) {
        logs = logs.filter(log => log.action.toLowerCase().includes(filters.action!.toLowerCase()));
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        logs = logs.filter(log => new Date(log.created_at) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        logs = logs.filter(log => new Date(log.created_at) <= endDate);
      }
      
      // Sort by date (newest first)
      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedLogs = logs.slice(offset, offset + limit);
      
      // Get user information for each log
      const users = await db.getUsers();
      const logsWithUsers = paginatedLogs.map(log => ({
        ...log,
        user: users.find(u => u.id === log.user_id) || null,
      }));
      
      return {
        logs: logsWithUsers,
        total: logs.length,
        hasMore: offset + limit < logs.length,
      };
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
    staleTime: 1000 * 60 * 2, // 2 minutes - logs are relatively static
  });
};

// Hook to get logs for a specific user
export const useLogsByUser = (userId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: logKeys.byUser(userId),
    queryFn: async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        throw new Error('Acesso negado: apenas admins podem visualizar logs');
      }
      
      const db = await getDatabase();
      const logs = await db.getActivityLogs();
      
      const userLogs = logs
        .filter(log => log.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100); // Last 100 actions for this user
      
      // Get user information
      const users = await db.getUsers();
      const targetUser = users.find(u => u.id === userId);
      
      const logsWithUser = userLogs.map(log => ({
        ...log,
        user: targetUser || null,
      }));
      
      return {
        logs: logsWithUser,
        user: targetUser,
        total: userLogs.length,
      };
    },
    enabled: !!userId && !!user && (user.role === 'admin' || user.role === 'superadmin'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to get logs within a date range
export const useLogsByDateRange = (startDate: string, endDate: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: logKeys.byDateRange(startDate, endDate),
    queryFn: async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        throw new Error('Acesso negado: apenas admins podem visualizar logs');
      }
      
      const db = await getDatabase();
      const logs = await db.getActivityLogs();
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      const filteredLogs = logs
        .filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= start && logDate <= end;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Get user information for each log
      const users = await db.getUsers();
      const logsWithUsers = filteredLogs.map(log => ({
        ...log,
        user: users.find(u => u.id === log.user_id) || null,
      }));
      
      return {
        logs: logsWithUsers,
        total: filteredLogs.length,
        startDate: start,
        endDate: end,
      };
    },
    enabled: !!startDate && !!endDate && !!user && (user.role === 'admin' || user.role === 'superadmin'),
    staleTime: 1000 * 60 * 10, // 10 minutes - historical data doesn't change
  });
};

// Hook to get activity log statistics
export const useLogStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...logKeys.all, 'stats'],
    queryFn: async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        throw new Error('Acesso negado: apenas admins podem visualizar estatísticas');
      }
      
      const db = await getDatabase();
      const logs = await db.getActivityLogs();
      
      // Calculate statistics
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate.toDateString() === today.toDateString();
      });
      
      const yesterdayLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate.toDateString() === yesterday.toDateString();
      });
      
      // Group by action type
      const actionCounts: Record<string, number> = {};
      logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
      
      // Most active users
      const userActivity: Record<string, number> = {};
      logs.forEach(log => {
        userActivity[log.user_id] = (userActivity[log.user_id] || 0) + 1;
      });
      
      const users = await db.getUsers();
      const topUsers = Object.entries(userActivity)
        .map(([userId, count]) => ({
          user: users.find(u => u.id === userId),
          activityCount: count,
        }))
        .filter(item => item.user)
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, 5);
      
      return {
        totalLogs: logs.length,
        todayLogs: todayLogs.length,
        yesterdayLogs: yesterdayLogs.length,
        actionCounts,
        topUsers,
        lastUpdate: new Date().toISOString(),
      };
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Helper function to format action names for display
export const formatActionName = (action: string): string => {
  const actionMap: Record<string, string> = {
    'LOGIN_SUCCESS': '✅ Login realizado',
    'LOGIN_FAILED': '❌ Falha no login',
    'LOGOUT': '🚪 Logout',
    'SESSION_RESTORED': '🔄 Sessão restaurada',
    'SYSTEM_INIT': '🚀 Sistema inicializado',
    'PRODUCT_CREATED': '➕ Produto criado',
    'PRODUCT_UPDATED': '✏️ Produto atualizado',
    'PRODUCT_DELETED': '🗑️ Produto removido',
    'STOCK_SALE': '💰 Venda realizada',
    'STOCK_PURCHASE': '📦 Entrada de estoque',
    'STOCK_ADJUSTMENT': '⚙️ Ajuste de estoque',
    'STOCK_RETURN': '🔄 Devolução',
    'STOCK_LOSS': '⚠️ Perda registrada',
    'USER_CREATED': '👤➕ Usuário criado',
    'USER_UPDATED': '👤✏️ Usuário atualizado',
    'USER_DELETED': '👤🗑️ Usuário removido',
    'PASSWORD_RESET': '🔐 Senha resetada',
  };
  
  return actionMap[action] || action;
};

// Helper function to get action color class
export const getActionColorClass = (action: string): string => {
  if (action.includes('LOGIN') || action.includes('SESSION')) return 'text-blue-600';
  if (action.includes('LOGOUT')) return 'text-gray-600';
  if (action.includes('CREATED')) return 'text-green-600';
  if (action.includes('UPDATED')) return 'text-yellow-600';
  if (action.includes('DELETED') || action.includes('LOSS')) return 'text-red-600';
  if (action.includes('SALE')) return 'text-green-600';
  if (action.includes('PURCHASE')) return 'text-blue-600';
  if (action.includes('PASSWORD')) return 'text-orange-600';
  
  return 'text-gray-600';
};
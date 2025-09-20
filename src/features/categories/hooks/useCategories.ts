import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/services/db';
import type { Category, CategoryFormData } from '@/types';
import { useAuth } from '@/features/auth/context/AuthContext';

// Query keys for React Query cache management
export const categoryKeys = {
  all: ['categories'] as const,
  active: () => [...categoryKeys.all, 'active'] as const,
  byId: (id: string) => [...categoryKeys.all, id] as const,
};

// Hook to get all active categories
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.active(),
    queryFn: async () => {
      const db = await getDatabase();
      return db.getCategories();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - categories don't change often
  });
};

// Hook to get a single category by ID
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: categoryKeys.byId(id),
    queryFn: async () => {
      const db = await getDatabase();
      return db.getCategoryById(id);
    },
    enabled: !!id,
  });
};

// Hook to create a new category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      const db = await getDatabase();

      if (!user) throw new Error('Usuário não autenticado');

      const newCategory = await db.createCategory(categoryData);

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'CATEGORY_CREATED',
        details: `Categoria "${newCategory.name}" criada`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return newCategory;
    },
    onSuccess: () => {
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};

// Hook to update a category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const db = await getDatabase();

      if (!user) throw new Error('Usuário não autenticado');

      const updatedCategory = await db.updateCategory(id, updates);

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'CATEGORY_UPDATED',
        details: `Categoria "${updatedCategory.name}" atualizada`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return updatedCategory;
    },
    onSuccess: (updatedCategory) => {
      // Update cache
      queryClient.setQueryData(
        categoryKeys.byId(updatedCategory.id),
        updatedCategory
      );
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};

// Hook to delete a category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = await getDatabase();

      if (!user) throw new Error('Usuário não autenticado');

      const category = await db.getCategoryById(id);
      if (!category) throw new Error('Categoria não encontrada');

      await db.deleteCategory(id);

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'CATEGORY_DELETED',
        details: `Categoria "${category.name}" removida`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return id;
    },
    onSuccess: () => {
      // Invalidate categories cache
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};
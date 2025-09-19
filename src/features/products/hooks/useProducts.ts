import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/services/db';
import type { Product, ProductFormData } from '@/types';
import { useAuth } from '@/features/auth/context/AuthContext';

// Query keys for React Query cache management
export const productKeys = {
  all: ['products'] as const,
  active: () => [...productKeys.all, 'active'] as const,
  lowStock: () => [...productKeys.all, 'low-stock'] as const,
  byId: (id: string) => [...productKeys.all, id] as const,
};

// Hook to get all active products
export const useProducts = () => {
  return useQuery({
    queryKey: productKeys.active(),
    queryFn: async () => {
      const db = await getDatabase();
      return db.getProducts();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - products change frequently
  });
};

// Hook to get products with low stock
export const useLowStockProducts = () => {
  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: async () => {
      const db = await getDatabase();
      const products = await db.getProducts();
      return products.filter(product => product.current_stock <= product.minimum_stock);
    },
    staleTime: 1000 * 60 * 1, // 1 minute - critical data
  });
};

// Hook to get a single product by ID
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.byId(id),
    queryFn: async () => {
      const db = await getDatabase();
      return db.getProductById(id);
    },
    enabled: !!id,
  });
};

// Hook to create a new product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const db = await getDatabase();
      
      if (!user) throw new Error('Usuário não autenticado');
      
      const newProduct = await db.createProduct({
        ...productData,
        active: true,
        created_by: user.id,
      });

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'PRODUCT_CREATED',
        details: `Produto "${newProduct.name}" criado (${newProduct.category})`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return newProduct;
    },
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

// Hook to update a product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const db = await getDatabase();
      
      if (!user) throw new Error('Usuário não autenticado');
      
      const updatedProduct = await db.updateProduct(id, updates);

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'PRODUCT_UPDATED',
        details: `Produto "${updatedProduct.name}" atualizado`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return updatedProduct;
    },
    onSuccess: (updatedProduct) => {
      // Update cache
      queryClient.setQueryData(
        productKeys.byId(updatedProduct.id),
        updatedProduct
      );
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

// Hook to delete (deactivate) a product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = await getDatabase();
      
      if (!user) throw new Error('Usuário não autenticado');
      
      const product = await db.getProductById(id);
      if (!product) throw new Error('Produto não encontrado');

      await db.deleteProduct(id);

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: 'PRODUCT_DELETED',
        details: `Produto "${product.name}" removido`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return id;
    },
    onSuccess: () => {
      // Invalidate products cache
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

// Hook to update product stock
export const useUpdateProductStock = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      newStock, 
      movementType = 'adjustment', 
      notes 
    }: { 
      productId: string; 
      newStock: number; 
      movementType?: 'sale' | 'purchase' | 'adjustment' | 'return' | 'loss';
      notes?: string;
    }) => {
      const db = await getDatabase();
      
      if (!user) throw new Error('Usuário não autenticado');
      
      const product = await db.getProductById(productId);
      if (!product) throw new Error('Produto não encontrado');
      
      const previousStock = product.current_stock;
      const quantity = Math.abs(newStock - previousStock);
      
      // Update product stock
      const updatedProduct = await db.updateProduct(productId, {
        current_stock: newStock,
      });
      
      // Create stock movement record
      await db.createStockMovement({
        product_id: productId,
        movement_type: movementType,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        notes,
        created_by: user.id,
      });

      // Log the action
      await db.createActivityLog({
        user_id: user.id,
        action: `STOCK_${movementType.toUpperCase()}`,
        details: `Estoque do produto "${product.name}" alterado de ${previousStock} para ${newStock} (${quantity} unidades)`,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
      });

      return updatedProduct;
    },
    onSuccess: (updatedProduct) => {
      // Update cache
      queryClient.setQueryData(
        productKeys.byId(updatedProduct.id),
        updatedProduct
      );
      // Invalidate products and stock-related queries
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};
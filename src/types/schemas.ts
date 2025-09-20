import { z } from 'zod';

// User Schemas
export const userRoleSchema = z.enum(['superadmin', 'admin', 'user']);

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  avatarId: z.string().optional(),
  role: userRoleSchema,
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  last_login: z.string().datetime().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Nome de exibição deve ter pelo menos 2 caracteres')
    .max(100, 'Nome de exibição deve ter no máximo 100 caracteres'),
  email: z.string().email('Por favor, insira um email válido'),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória'),
  new_password: z
    .string()
    .min(6, 'A nova senha deve ter pelo menos 6 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
});

// Category Schemas
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid(),
});

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome da categoria é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  icon: z
    .string()
    .max(50, 'Ícone deve ter no máximo 50 caracteres')
    .optional(),
  color: z
    .string()
    .max(20, 'Cor deve ter no máximo 20 caracteres')
    .optional(),
});

// Product Schemas
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  unit: z.string().min(1).max(50),
  packaging: z.string().min(1).max(200),
  purchase_price: z.number().positive(),
  sale_price: z.number().positive(),
  current_stock: z.number().int().min(0),
  minimum_stock: z.number().int().min(0),
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid(),
});

export const productFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do produto é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .trim(),
  category: z
    .string()
    .min(1, 'Categoria é obrigatória')
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .trim(),
  unit: z
    .string()
    .min(1, 'Unidade é obrigatória')
    .max(50, 'Unidade deve ter no máximo 50 caracteres')
    .trim(),
  packaging: z
    .string()
    .min(1, 'Embalagem é obrigatória')
    .max(200, 'Embalagem deve ter no máximo 200 caracteres')
    .trim(),
  purchase_price: z
    .number({ message: 'Preço de compra deve ser um número' })
    .positive('Preço de compra deve ser maior que zero')
    .max(999999.99, 'Preço de compra deve ser menor que R$ 999.999,99'),
  sale_price: z
    .number({ message: 'Preço de venda deve ser um número' })
    .positive('Preço de venda deve ser maior que zero')
    .max(999999.99, 'Preço de venda deve ser menor que R$ 999.999,99'),
  minimum_stock: z
    .number({ message: 'Estoque mínimo deve ser um número' })
    .int('Estoque mínimo deve ser um número inteiro')
    .min(0, 'Estoque mínimo deve ser maior ou igual a zero')
    .max(999999, 'Estoque mínimo deve ser menor que 999.999'),
  current_stock: z
    .number({ message: 'Estoque atual deve ser um número' })
    .int('Estoque atual deve ser um número inteiro')
    .min(0, 'Estoque atual deve ser maior ou igual a zero')
    .max(999999, 'Estoque atual deve ser menor que 999.999'),
}).refine((data) => data.sale_price > data.purchase_price, {
  message: 'Preço de venda deve ser maior que o preço de compra',
  path: ['sale_price'],
});

// Stock Movement Schemas
export const movementTypeSchema = z.enum(['sale', 'purchase', 'adjustment', 'return', 'loss']);

export const stockMovementSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  movement_type: movementTypeSchema,
  quantity: z.number().int().positive(),
  previous_stock: z.number().int().min(0),
  new_stock: z.number().int().min(0),
  unit_price: z.number().positive().optional(),
  total_value: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  created_at: z.string().datetime(),
  created_by: z.string().uuid(),
});

export const stockMovementFormSchema = z.object({
  product_id: z
    .string({ message: 'Produto é obrigatório' })
    .uuid('ID do produto inválido'),
  movement_type: z.enum(['sale', 'purchase', 'adjustment', 'return', 'loss']),
  quantity: z
    .number({ message: 'Quantidade deve ser um número' })
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que zero')
    .max(999999, 'Quantidade deve ser menor que 999.999'),
  unit_price: z
    .number({ message: 'Preço unitário deve ser um número' })
    .positive('Preço unitário deve ser maior que zero')
    .max(999999.99, 'Preço unitário deve ser menor que R$ 999.999,99')
    .optional(),
  notes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
});

// Activity Log Schema
export const activityLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: z.string().min(1).max(100),
  details: z.string().max(1000),
  ip_address: z.string().optional(),
  user_agent: z.string().max(500).optional(),
  created_at: z.string().datetime(),
});

// Query Parameters Schemas
export const productsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  low_stock: z.boolean().optional(),
  active: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
}).strict();

export const stockMovementsQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  movement_type: movementTypeSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
}).strict();

export const logsQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  action: z.string().max(100).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
}).strict();

// API Response Schema
export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
  z.object({
    data: dataSchema,
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
  });

// Environment Variables Schema
export const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL deve ser uma URL válida'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY é obrigatório'),
  VITE_APP_NAME: z.string().default('Mascate Runeria'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_USE_LOCAL_DB: z.string().default('false').transform((val) => val === 'true'),
  VITE_DB_NAME: z.string().default('mascate_stock.db'),
});

// Type exports for use with react-hook-form
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type CategoryFormData = z.infer<typeof categoryFormSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;
export type StockMovementFormData = z.infer<typeof stockMovementFormSchema>;
export type ProductsQueryParams = z.infer<typeof productsQuerySchema>;
export type StockMovementsQueryParams = z.infer<typeof stockMovementsQuerySchema>;
export type LogsQueryParams = z.infer<typeof logsQuerySchema>;
export type EnvConfig = z.infer<typeof envSchema>;
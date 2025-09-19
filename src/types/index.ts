// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export type UserRole = 'superadmin' | 'admin' | 'user';

export interface AuthSession {
  user: User;
  token: string;
  expires_at: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  packaging: string;
  purchase_price: number;
  sale_price: number;
  current_stock: number;
  minimum_stock: number;
  active: boolean;
  created_at: string;
  updated_at?: string;
  created_by: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  unit: string;
  packaging: string;
  purchase_price: number;
  sale_price: number;
  minimum_stock: number;
  current_stock: number;
}

// Stock Movement Types
export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_price?: number;
  total_value?: number;
  notes?: string;
  created_at: string;
  created_by: string;
  product?: Product; // Join relation
}

export type StockMovementType = 'sale' | 'purchase' | 'adjustment' | 'return' | 'loss';

export interface StockMovementFormData {
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

// Log Types
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User; // Join relation
}

// Dashboard Types
export interface DashboardStats {
  total_products: number;
  low_stock_products: number;
  total_purchase_value: number;
  total_sale_value: number;
  potential_profit: number;
  recent_movements: StockMovement[];
  low_stock_items: Product[];
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Query Types for React Query
export interface ProductsQueryParams {
  search?: string;
  category?: string;
  low_stock?: boolean;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface StockMovementsQueryParams {
  product_id?: string;
  movement_type?: StockMovementType;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface LogsQueryParams {
  user_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  activeView: string;
  loading: boolean;
}

// Database Schema Types (for SQLite)
export interface DBSchema {
  users: User;
  products: Product;
  stock_movements: StockMovement;
  activity_logs: ActivityLog;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>>;

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
}

export interface StockLevelChartData {
  product_name: string;
  current_stock: number;
  minimum_stock: number;
  status: 'ok' | 'low' | 'critical';
}

export interface SalesChartData {
  date: string;
  quantity: number;
  revenue: number;
}

// Constants
export const STOCK_STATUS = {
  OK: 'ok',
  LOW: 'low',
  CRITICAL: 'critical',
} as const;

export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const MOVEMENT_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
  LOSS: 'loss',
} as const;
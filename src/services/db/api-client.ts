import type { User, Product, StockMovement, ActivityLog, Category, CategoryFormData } from '@/types';

export interface DatabaseService {
  init(): Promise<void>;
  close(): Promise<void>;

  // Authentication
  login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;

  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  createCategory(category: CategoryFormData): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  getStockMovements(): Promise<StockMovement[]>;
  createStockMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement>;

  getActivityLogs(): Promise<ActivityLog[]>;
  createActivityLog(log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog>;

  // System methods
  getSystemInfo(): Promise<any>;
  createBackup(): Promise<Blob>;
  exportData(format: 'csv' | 'json'): Promise<Blob>;
  cleanupData(type: 'logs' | 'movements'): Promise<any>;

  // Configuration methods
  getConfiguration(key: string): Promise<any>;
  saveConfiguration(key: string, value: any, description?: string): Promise<any>;

  exportDatabase(): Promise<Uint8Array>;
  importDatabase(data: Uint8Array): Promise<void>;
}

class ApiDatabaseService implements DatabaseService {
  private baseUrl: string;
  private initialized = false;

  constructor() {
    // Usar variável de ambiente ou detectar automaticamente
    this.baseUrl = import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD
        ? '/api'                              // URL relativa em produção (mesma origem)
        : this.detectDevPort());               // Detectar porta de desenvolvimento
  }

  private detectDevPort(): string {
    // Em desenvolvimento, usar o servidor Express na porta 3001
    return 'http://localhost:3001/api';
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Inicializando cliente API...');
      console.log(`🌐 Base URL: ${this.baseUrl}`);

      // Testar conectividade com a API
      const response = await fetch(`${this.baseUrl}/users`);
      if (!response.ok) {
        throw new Error(`API não respondeu: ${response.status}`);
      }

      this.initialized = true;
      console.log('✅ Cliente API inicializado com sucesso!');

    } catch (error) {
      console.error('❌ Falha ao inicializar cliente API:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Não há conexão para fechar no cliente HTTP
    this.initialized = false;
    console.log('🔌 Cliente API fechado');
  }

  // Authentication method
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return data;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão'
      };
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.request<User>(`/users?id=${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.request<User>(`/users?email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.request<User>(`/users?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/users?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      return await this.request<Category>(`/categories/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createCategory(category: CategoryFormData): Promise<Category> {
    return this.request<Category>('/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    return this.request<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await this.request<Product>(`/products?id=${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Stock movement methods
  async getStockMovements(): Promise<StockMovement[]> {
    return this.request<StockMovement[]>('/stock-movements');
  }

  async createStockMovement(movementData: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    return this.request<StockMovement>('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  }

  // Activity log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.request<ActivityLog[]>('/activity-logs');
  }

  async createActivityLog(logData: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
    return this.request<ActivityLog>('/activity-logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  // Export/Import methods
  async exportDatabase(): Promise<Uint8Array> {
    const [users, products, movements, logs] = await Promise.all([
      this.getUsers(),
      this.getProducts(),
      this.getStockMovements(),
      this.getActivityLogs(),
    ]);

    const exportData = {
      users,
      products,
      stock_movements: movements,
      activity_logs: logs,
      exported_at: new Date().toISOString(),
      source: 'api'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new TextEncoder().encode(jsonString);
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    // Import seria implementado via endpoint específico se necessário
    const jsonString = new TextDecoder().decode(data);
    const importData = JSON.parse(jsonString);

    console.log('📥 Import solicitado:', {
      users: importData.users?.length || 0,
      products: importData.products?.length || 0,
      movements: importData.stock_movements?.length || 0,
      logs: importData.activity_logs?.length || 0
    });

    // TODO: Implementar endpoint de import se necessário
    throw new Error('Import via API não implementado ainda');
  }

  // System methods
  async getSystemInfo(): Promise<any> {
    return this.request<any>('/system/info');
  }

  async createBackup(): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/system/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async exportData(format: 'csv' | 'json'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/system/export/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async cleanupData(type: 'logs' | 'movements'): Promise<any> {
    return this.request<any>(`/system/cleanup/${type}`, {
      method: 'DELETE',
    });
  }

  // Configuration methods
  async getConfiguration(key: string): Promise<any> {
    return this.request<any>(`/config/${key}`);
  }

  async saveConfiguration(key: string, value: any, description?: string): Promise<any> {
    return this.request<any>(`/config/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, description }),
    });
  }
}

// Singleton instance
let dbService: ApiDatabaseService | null = null;

export const getDatabase = async (): Promise<DatabaseService> => {
  if (!dbService) {
    dbService = new ApiDatabaseService();
    await dbService.init();
  }
  return dbService;
};

export const closeDatabase = async (): Promise<void> => {
  if (dbService) {
    await dbService.close();
    dbService = null;
  }
};
import type { User, Product, StockMovement, ActivityLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Browser-compatible database service using localStorage
export interface DatabaseService {
  init(): Promise<void>;
  close(): Promise<void>;
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  getStockMovements(): Promise<StockMovement[]>;
  createStockMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement>;
  
  getActivityLogs(): Promise<ActivityLog[]>;
  createActivityLog(log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog>;
  
  exportDatabase(): Promise<Uint8Array>;
  importDatabase(data: Uint8Array): Promise<void>;
}

class BrowserDatabaseService implements DatabaseService {
  private dbName = 'mascate_stock_v2';
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if we have any data
      const hasData = this.hasExistingData();
      
      if (!hasData) {
        console.log('🔄 Initializing database with seed data...');
        await this.seedInitialData();
      } else {
        console.log('✅ Database found with existing data');
      }
      
      this.initialized = true;
      console.log('✅ Browser database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Nothing to close in localStorage implementation
    this.initialized = false;
  }

  private hasExistingData(): boolean {
    const users = localStorage.getItem(this.getKey('users'));
    return users !== null;
  }

  private getKey(table: string): string {
    return `${this.dbName}_${table}`;
  }

  private async seedInitialData(): Promise<void> {
    // Create admin user
    const adminUser: User = {
      id: uuidv4(),
      username: 'admin',
      email: 'admin@mascate.local',
      role: 'superadmin',
      active: true,
      created_at: new Date().toISOString(),
    };

    await this.saveToStorage('users', [adminUser]);

    // Create sample products
    const sampleProducts: Product[] = [
      {
        id: uuidv4(),
        name: 'Seda',
        category: 'fumo',
        unit: 'unidade',
        packaging: 'Caixa com 50 unidades',
        purchase_price: 1.80,
        sale_price: 2.50,
        current_stock: 50,
        minimum_stock: 20,
        active: true,
        created_at: new Date().toISOString(),
        created_by: adminUser.id,
      },
      {
        id: uuidv4(),
        name: 'Bala Halls',
        category: 'doce',
        unit: 'unidade',
        packaging: 'Pacote com 100 unidades',
        purchase_price: 0.70,
        sale_price: 1.00,
        current_stock: 120,
        minimum_stock: 50,
        active: true,
        created_at: new Date().toISOString(),
        created_by: adminUser.id,
      },
      {
        id: uuidv4(),
        name: 'Chocolate Kit Kat',
        category: 'doce',
        unit: 'unidade',
        packaging: 'Caixa com 48 unidades',
        purchase_price: 3.20,
        sale_price: 4.50,
        current_stock: 80,
        minimum_stock: 30,
        active: true,
        created_at: new Date().toISOString(),
        created_by: adminUser.id,
      },
    ];

    await this.saveToStorage('products', sampleProducts);
    await this.saveToStorage('stock_movements', []);
    await this.saveToStorage('activity_logs', []);

    // Log initialization
    await this.createActivityLog({
      user_id: adminUser.id,
      action: 'SYSTEM_INIT',
      details: 'Sistema inicializado com dados de exemplo',
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent,
    });

    console.log('✅ Seed data created successfully');
  }

  private async saveToStorage<T>(table: string, data: T[]): Promise<void> {
    try {
      localStorage.setItem(this.getKey(table), JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${table} to localStorage:`, error);
      throw error;
    }
  }

  private async loadFromStorage<T>(table: string): Promise<T[]> {
    try {
      const data = localStorage.getItem(this.getKey(table));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to load ${table} from localStorage:`, error);
      return [];
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    const users = await this.loadFromStorage<User>('users');
    return users.filter(u => u.active);
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.loadFromStorage<User>('users');
    return users.find(u => u.id === id && u.active) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.loadFromStorage<User>('users');
    return users.find(u => u.email === email && u.active) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const users = await this.loadFromStorage<User>('users');
    
    const newUser: User = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      ...userData,
    };

    users.push(newUser);
    await this.saveToStorage('users', users);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const users = await this.loadFromStorage<User>('users');
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser: User = {
      ...users[userIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;
    await this.saveToStorage('users', users);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const users = await this.loadFromStorage<User>('users');
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], active: false };
      await this.saveToStorage('users', users);
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const products = await this.loadFromStorage<Product>('products');
    return products.filter(p => p.active);
  }

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.loadFromStorage<Product>('products');
    return products.find(p => p.id === id && p.active) || null;
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const products = await this.loadFromStorage<Product>('products');
    
    const newProduct: Product = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      ...productData,
    };

    products.push(newProduct);
    await this.saveToStorage('products', products);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const products = await this.loadFromStorage<Product>('products');
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    const updatedProduct: Product = {
      ...products[productIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    products[productIndex] = updatedProduct;
    await this.saveToStorage('products', products);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const products = await this.loadFromStorage<Product>('products');
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex !== -1) {
      products[productIndex] = { ...products[productIndex], active: false };
      await this.saveToStorage('products', products);
    }
  }

  // Stock movement methods
  async getStockMovements(): Promise<StockMovement[]> {
    return await this.loadFromStorage<StockMovement>('stock_movements');
  }

  async createStockMovement(movementData: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    const movements = await this.loadFromStorage<StockMovement>('stock_movements');
    
    const newMovement: StockMovement = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      ...movementData,
    };

    movements.push(newMovement);
    await this.saveToStorage('stock_movements', movements);
    return newMovement;
  }

  // Activity log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    const logs = await this.loadFromStorage<ActivityLog>('activity_logs');
    return logs.slice(-100); // Return last 100 logs
  }

  async createActivityLog(logData: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
    const logs = await this.loadFromStorage<ActivityLog>('activity_logs');
    
    const newLog: ActivityLog = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      ...logData,
    };

    logs.push(newLog);
    
    // Keep only last 1000 logs to prevent localStorage bloat
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    await this.saveToStorage('activity_logs', logs);
    return newLog;
  }

  async exportDatabase(): Promise<Uint8Array> {
    const data = {
      users: await this.loadFromStorage<User>('users'),
      products: await this.loadFromStorage<Product>('products'),
      stock_movements: await this.loadFromStorage<StockMovement>('stock_movements'),
      activity_logs: await this.loadFromStorage<ActivityLog>('activity_logs'),
    };
    
    const jsonString = JSON.stringify(data);
    return new TextEncoder().encode(jsonString);
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    const jsonString = new TextDecoder().decode(data);
    const importedData = JSON.parse(jsonString);
    
    if (importedData.users) await this.saveToStorage('users', importedData.users);
    if (importedData.products) await this.saveToStorage('products', importedData.products);
    if (importedData.stock_movements) await this.saveToStorage('stock_movements', importedData.stock_movements);
    if (importedData.activity_logs) await this.saveToStorage('activity_logs', importedData.activity_logs);
  }
}

// Singleton instance
let dbService: BrowserDatabaseService | null = null;

export const getDatabase = async (): Promise<DatabaseService> => {
  if (!dbService) {
    dbService = new BrowserDatabaseService();
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
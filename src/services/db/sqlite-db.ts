import initSqlJs, { type Database } from 'sql.js';
import type { User, Product, StockMovement, ActivityLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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

class SQLiteDatabaseService implements DatabaseService {
  private db: Database | null = null;
  private SQL: any = null;
  private initialized = false;
  private dbName = 'mascate_stock.db';

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing SQLite database...');

      // Initialize SQL.js
      this.SQL = await initSqlJs({
        locateFile: () => `/sql-wasm.wasm`
      });

      // Try to load existing database from IndexedDB
      const existingDb = await this.loadDatabaseFromIndexedDB();

      if (existingDb) {
        console.log('✅ Loading existing database from IndexedDB');
        this.db = new this.SQL.Database(existingDb);
      } else {
        // Try to load initial database from public folder
        const initialDb = await this.loadInitialDatabase();

        if (initialDb) {
          console.log('✅ Loading initial database from public folder');
          this.db = new this.SQL.Database(initialDb);
        } else {
          console.log('🔄 Creating new database with schema...');
          this.db = new this.SQL.Database();
          await this.createSchema();
          await this.seedInitialData();
        }
      }

      // Migrate localStorage data if exists
      await this.migrateFromLocalStorage();

      // Save to IndexedDB
      await this.saveDatabaseToIndexedDB();

      this.initialized = true;
      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      // Save to IndexedDB before closing
      await this.saveDatabaseToIndexedDB();
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
  }

  private async createSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        displayName TEXT NOT NULL,
        avatarId TEXT,
        role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'user')),
        active BOOLEAN NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL,
        packaging TEXT,
        purchase_price REAL NOT NULL,
        sale_price REAL NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        minimum_stock INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        created_by TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Stock movements table
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        movement_type TEXT NOT NULL CHECK(movement_type IN ('sale', 'purchase', 'adjustment', 'return', 'loss')),
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        unit_price REAL,
        total_value REAL,
        notes TEXT,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Activity logs table
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    `;

    this.db.exec(schema);
    console.log('✅ Database schema created');
  }

  private async seedInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create admin user
    const adminId = uuidv4();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO users (id, username, email, displayName, avatarId, role, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [adminId, 'admin', 'admin@mascate.com', 'Administrador', 'admin-male-1', 'superadmin', 1, now]);

    // Create sample products
    const products = [
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
      },
    ];

    for (const product of products) {
      this.db.run(`
        INSERT INTO products (id, name, category, unit, packaging, purchase_price, sale_price, current_stock, minimum_stock, active, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [product.id, product.name, product.category, product.unit, product.packaging, product.purchase_price, product.sale_price, product.current_stock, product.minimum_stock, 1, now, adminId]);
    }

    // Log initialization
    this.db.run(`
      INSERT INTO activity_logs (id, user_id, action, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), adminId, 'SYSTEM_INIT', 'Sistema inicializado com dados de exemplo', '127.0.0.1', navigator.userAgent, now]);

    console.log('✅ Initial data seeded');
  }

  private async migrateFromLocalStorage(): Promise<void> {
    try {
      const oldData = localStorage.getItem('mascate_stock_v2_users');
      if (oldData && this.db) {
        const users = JSON.parse(oldData);
        console.log('🔄 Migrating users from localStorage...');

        // Check if users already exist to avoid duplicates
        const existingUsers = this.db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0]?.[0] || 0;

        if (existingUsers === 0) {
          for (const user of users) {
            this.db.run(`
              INSERT OR IGNORE INTO users (id, username, email, displayName, avatarId, role, active, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [user.id, user.username, user.email, user.displayName, user.avatarId || '', user.role, user.active ? 1 : 0, user.created_at]);
          }

          // Migrate products
          const oldProducts = localStorage.getItem('mascate_stock_v2_products');
          if (oldProducts) {
            const products = JSON.parse(oldProducts);
            for (const product of products) {
              this.db.run(`
                INSERT OR IGNORE INTO products (id, name, category, unit, packaging, purchase_price, sale_price, current_stock, minimum_stock, active, created_at, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [product.id, product.name, product.category, product.unit, product.packaging || '', product.purchase_price, product.sale_price, product.current_stock, product.minimum_stock, product.active ? 1 : 0, product.created_at, product.created_by]);
            }
          }

          // Migrate stock movements with data transformation
          const oldMovements = localStorage.getItem('mascate_stock_v2_stock_movements');
          if (oldMovements) {
            const movements = JSON.parse(oldMovements);
            for (const movement of movements) {
              // Transform old movement data to new format
              const movementType = movement.type === 'IN' ? 'purchase' : 'sale';
              const prevStock = movement.previous_stock || 0;
              const newStock = movement.new_stock || prevStock + (movement.type === 'IN' ? movement.quantity : -movement.quantity);

              this.db.run(`
                INSERT OR IGNORE INTO stock_movements (id, product_id, movement_type, quantity, previous_stock, new_stock, unit_price, total_value, notes, created_at, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [movement.id, movement.product_id, movementType, movement.quantity, prevStock, newStock, movement.unit_price, movement.total_price || movement.total_value, movement.notes || movement.reason, movement.created_at, movement.created_by]);
            }
          }

          // Migrate activity logs
          const oldLogs = localStorage.getItem('mascate_stock_v2_activity_logs');
          if (oldLogs) {
            const logs = JSON.parse(oldLogs);
            for (const log of logs) {
              this.db.run(`
                INSERT OR IGNORE INTO activity_logs (id, user_id, action, details, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [log.id, log.user_id, log.action, log.details || '', log.ip_address || '', log.user_agent || '', log.created_at]);
            }
          }

          console.log('✅ Migration from localStorage completed');
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to migrate from localStorage:', error);
    }
  }

  private async saveDatabaseToIndexedDB(): Promise<void> {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const dbRequest = indexedDB.open('MascateDB', 1);

      return new Promise((resolve, reject) => {
        dbRequest.onerror = () => reject(dbRequest.error);

        dbRequest.onupgradeneeded = () => {
          const db = dbRequest.result;
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database');
          }
        };

        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const transaction = db.transaction(['database'], 'readwrite');
          const store = transaction.objectStore('database');
          store.put(data, this.dbName);

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      });
    } catch (error) {
      console.warn('⚠️ Failed to save database to IndexedDB:', error);
    }
  }

  private async loadInitialDatabase(): Promise<Uint8Array | null> {
    try {
      const response = await fetch('/mascate_stock.db');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to load initial database from public folder:', error);
      return null;
    }
  }

  private async loadDatabaseFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const dbRequest = indexedDB.open('MascateDB', 1);

      return new Promise((resolve) => {
        dbRequest.onerror = () => resolve(null);

        dbRequest.onupgradeneeded = () => {
          const db = dbRequest.result;
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database');
          }
        };

        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const transaction = db.transaction(['database'], 'readonly');
          const store = transaction.objectStore('database');
          const getRequest = store.get(this.dbName);

          getRequest.onsuccess = () => {
            resolve(getRequest.result || null);
          };

          getRequest.onerror = () => resolve(null);
        };
      });
    } catch (error) {
      console.warn('⚠️ Failed to load database from IndexedDB:', error);
      return null;
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec('SELECT * FROM users WHERE active = 1');
    if (!result.length) return [];

    return result[0].values.map((row: any[]) => ({
      id: row[0] as string,
      username: row[1] as string,
      email: row[2] as string,
      displayName: row[3] as string,
      avatarId: row[4] as string,
      role: row[5] as User['role'],
      active: !!row[6],
      created_at: row[7] as string,
      updated_at: (row[8] as string) || undefined,
    }));
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec('SELECT * FROM users WHERE id = ? AND active = 1', [id]);
    if (!result.length || !result[0].values.length) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as string,
      username: row[1] as string,
      email: row[2] as string,
      displayName: row[3] as string,
      avatarId: row[4] as string,
      role: row[5] as User['role'],
      active: !!row[6],
      created_at: row[7] as string,
      updated_at: (row[8] as string) || undefined,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec('SELECT * FROM users WHERE email = ? AND active = 1', [email]);
    if (!result.length || !result[0].values.length) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as string,
      username: row[1] as string,
      email: row[2] as string,
      displayName: row[3] as string,
      avatarId: row[4] as string,
      role: row[5] as User['role'],
      active: !!row[6],
      created_at: row[7] as string,
      updated_at: (row[8] as string) || undefined,
    };
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const created_at = new Date().toISOString();

    this.db.run(`
      INSERT INTO users (id, username, email, displayName, avatarId, role, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userData.username, userData.email, userData.displayName, userData.avatarId || '', userData.role, userData.active ? 1 : 0, created_at]);

    await this.saveDatabaseToIndexedDB();

    return {
      id,
      created_at,
      ...userData,
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const updated_at = new Date().toISOString();
    const user = await this.getUserById(id);
    if (!user) throw new Error('User not found');

    const updatedUser = { ...user, ...updates, updated_at };

    this.db.run(`
      UPDATE users
      SET username = ?, email = ?, displayName = ?, avatarId = ?, role = ?, active = ?, updated_at = ?
      WHERE id = ?
    `, [updatedUser.username, updatedUser.email, updatedUser.displayName, updatedUser.avatarId || '', updatedUser.role, updatedUser.active ? 1 : 0, updated_at, id]);

    await this.saveDatabaseToIndexedDB();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updated_at = new Date().toISOString();
    this.db.run('UPDATE users SET active = 0, updated_at = ? WHERE id = ?', [updated_at, id]);
    await this.saveDatabaseToIndexedDB();
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec('SELECT * FROM products WHERE active = 1');
    if (!result.length) return [];

    return result[0].values.map((row: any[]) => ({
      id: row[0] as string,
      name: row[1] as string,
      category: row[2] as string,
      unit: row[3] as string,
      packaging: row[4] as string,
      purchase_price: row[5] as number,
      sale_price: row[6] as number,
      current_stock: row[7] as number,
      minimum_stock: row[8] as number,
      active: !!row[9],
      created_at: row[10] as string,
      updated_at: (row[11] as string) || undefined,
      created_by: row[12] as string,
    }));
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec('SELECT * FROM products WHERE id = ? AND active = 1', [id]);
    if (!result.length || !result[0].values.length) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as string,
      name: row[1] as string,
      category: row[2] as string,
      unit: row[3] as string,
      packaging: row[4] as string,
      purchase_price: row[5] as number,
      sale_price: row[6] as number,
      current_stock: row[7] as number,
      minimum_stock: row[8] as number,
      active: !!row[9],
      created_at: row[10] as string,
      updated_at: (row[11] as string) || undefined,
      created_by: row[12] as string,
    };
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const created_at = new Date().toISOString();

    this.db.run(`
      INSERT INTO products (id, name, category, unit, packaging, purchase_price, sale_price, current_stock, minimum_stock, active, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, productData.name, productData.category, productData.unit, productData.packaging, productData.purchase_price, productData.sale_price, productData.current_stock, productData.minimum_stock, productData.active ? 1 : 0, created_at, productData.created_by]);

    await this.saveDatabaseToIndexedDB();

    return {
      id,
      created_at,
      ...productData,
    };
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (!this.db) throw new Error('Database not initialized');

    const updated_at = new Date().toISOString();
    const product = await this.getProductById(id);
    if (!product) throw new Error('Product not found');

    const updatedProduct = { ...product, ...updates, updated_at };

    this.db.run(`
      UPDATE products
      SET name = ?, category = ?, unit = ?, packaging = ?, purchase_price = ?, sale_price = ?, current_stock = ?, minimum_stock = ?, active = ?, updated_at = ?
      WHERE id = ?
    `, [updatedProduct.name, updatedProduct.category, updatedProduct.unit, updatedProduct.packaging, updatedProduct.purchase_price, updatedProduct.sale_price, updatedProduct.current_stock, updatedProduct.minimum_stock, updatedProduct.active ? 1 : 0, updated_at, id]);

    await this.saveDatabaseToIndexedDB();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updated_at = new Date().toISOString();
    this.db.run('UPDATE products SET active = 0, updated_at = ? WHERE id = ?', [updated_at, id]);
    await this.saveDatabaseToIndexedDB();
  }

  // Stock movement methods
  async getStockMovements(): Promise<StockMovement[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec('SELECT * FROM stock_movements ORDER BY created_at DESC');
    if (!result.length) return [];

    return result[0].values.map((row: any[]) => ({
      id: row[0] as string,
      product_id: row[1] as string,
      movement_type: row[2] as StockMovement['movement_type'],
      quantity: row[3] as number,
      previous_stock: row[4] as number,
      new_stock: row[5] as number,
      unit_price: row[6] as number,
      total_value: row[7] as number,
      notes: row[8] as string,
      created_at: row[9] as string,
      created_by: row[10] as string,
    }));
  }

  async createStockMovement(movementData: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const created_at = new Date().toISOString();

    this.db.run(`
      INSERT INTO stock_movements (id, product_id, movement_type, quantity, previous_stock, new_stock, unit_price, total_value, notes, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, movementData.product_id, movementData.movement_type, movementData.quantity, movementData.previous_stock, movementData.new_stock, movementData.unit_price || null, movementData.total_value || null, movementData.notes || null, created_at, movementData.created_by]);

    await this.saveDatabaseToIndexedDB();

    return {
      id,
      created_at,
      ...movementData,
    };
  }

  // Activity log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.exec('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100');
    if (!result.length) return [];

    return result[0].values.map((row: any[]) => ({
      id: row[0] as string,
      user_id: row[1] as string,
      action: row[2] as string,
      details: row[3] as string,
      ip_address: row[4] as string,
      user_agent: row[5] as string,
      created_at: row[6] as string,
    }));
  }

  async createActivityLog(logData: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const created_at = new Date().toISOString();

    this.db.run(`
      INSERT INTO activity_logs (id, user_id, action, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, logData.user_id, logData.action, logData.details || '', logData.ip_address || '', logData.user_agent || '', created_at]);

    // Keep only last 1000 logs
    this.db.run(`
      DELETE FROM activity_logs
      WHERE id NOT IN (
        SELECT id FROM activity_logs
        ORDER BY created_at DESC
        LIMIT 1000
      )
    `);

    await this.saveDatabaseToIndexedDB();

    return {
      id,
      created_at,
      ...logData,
    };
  }

  async exportDatabase(): Promise<Uint8Array> {
    if (!this.db) throw new Error('Database not initialized');

    return this.db.export();
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    if (!this.SQL) throw new Error('SQL.js not initialized');

    // Close current database
    if (this.db) {
      this.db.close();
    }

    // Create new database from imported data
    this.db = new this.SQL.Database(data);

    // Save to IndexedDB
    await this.saveDatabaseToIndexedDB();

    console.log('✅ Database imported successfully');
  }
}

// Singleton instance
let dbService: SQLiteDatabaseService | null = null;

export const getDatabase = async (): Promise<DatabaseService> => {
  if (!dbService) {
    dbService = new SQLiteDatabaseService();
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
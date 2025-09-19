import { Pool } from 'pg';
import type { User, Product, StockMovement, ActivityLog } from '@/types';

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

class PostgreSQLDatabaseService implements DatabaseService {
  private pool: Pool;
  private initialized = false;

  constructor() {
    // Configuração da conexão PostgreSQL
    this.pool = new Pool({
      user: 'postgres',
      password: '4c6c4d5fb548a9cb',
      host: 'postgres.platform.sinesys.app',
      port: 15432,
      database: 'postgres',
      ssl: false,
      // Configurações de pool
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Event listeners para debug
    this.pool.on('connect', () => {
      console.log('🔌 Nova conexão PostgreSQL estabelecida');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Erro no pool PostgreSQL:', err);
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Inicializando serviço PostgreSQL...');

      // Testar conexão
      const client = await this.pool.connect();
      const result = await client.query('SELECT version(), current_database()');
      client.release();

      console.log(`✅ Conectado ao PostgreSQL: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
      console.log(`📂 Database: ${result.rows[0].current_database}`);

      this.initialized = true;
      console.log('✅ Serviço PostgreSQL inicializado com sucesso!');

    } catch (error) {
      console.error('❌ Falha ao inicializar PostgreSQL:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Pool PostgreSQL fechado');
    }
    this.initialized = false;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
               role, active, created_at as "created_at", updated_at as "updated_at"
        FROM mascate_pro.users
        WHERE active = true
        ORDER BY created_at DESC
      `);

      return result.rows.map(row => ({
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      }));
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
               role, active, created_at as "created_at", updated_at as "updated_at"
        FROM mascate_pro.users
        WHERE id = $1 AND active = true
      `, [id]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
               role, active, created_at as "created_at", updated_at as "updated_at"
        FROM mascate_pro.users
        WHERE email = $1 AND active = true
      `, [email]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO mascate_pro.users (username, email, display_name, avatar_id, role, active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username, email, display_name as "displayName", avatar_id as "avatarId",
                  role, active, created_at as "created_at", updated_at as "updated_at"
      `, [userData.username, userData.email, userData.displayName, userData.avatarId, userData.role, userData.active]);

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const client = await this.pool.connect();
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.username !== undefined) {
        fields.push(`username = $${paramCount++}`);
        values.push(updates.username);
      }
      if (updates.email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(updates.email);
      }
      if (updates.displayName !== undefined) {
        fields.push(`display_name = $${paramCount++}`);
        values.push(updates.displayName);
      }
      if (updates.avatarId !== undefined) {
        fields.push(`avatar_id = $${paramCount++}`);
        values.push(updates.avatarId);
      }
      if (updates.role !== undefined) {
        fields.push(`role = $${paramCount++}`);
        values.push(updates.role);
      }
      if (updates.active !== undefined) {
        fields.push(`active = $${paramCount++}`);
        values.push(updates.active);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(`
        UPDATE mascate_pro.users
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, username, email, display_name as "displayName", avatar_id as "avatarId",
                  role, active, created_at as "created_at", updated_at as "updated_at"
      `, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE mascate_pro.users
        SET active = false, updated_at = NOW()
        WHERE id = $1
      `, [id]);
    } finally {
      client.release();
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, category, unit, packaging, purchase_price, sale_price,
               current_stock, minimum_stock, active,
               created_at as "created_at", updated_at as "updated_at", created_by
        FROM mascate_pro.products
        WHERE active = true
        ORDER BY name ASC
      `);

      return result.rows.map(row => ({
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      }));
    } finally {
      client.release();
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, category, unit, packaging, purchase_price, sale_price,
               current_stock, minimum_stock, active,
               created_at as "created_at", updated_at as "updated_at", created_by
        FROM mascate_pro.products
        WHERE id = $1 AND active = true
      `, [id]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO mascate_pro.products (name, category, unit, packaging, purchase_price, sale_price,
                                        current_stock, minimum_stock, active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, category, unit, packaging, purchase_price, sale_price,
                  current_stock, minimum_stock, active,
                  created_at as "created_at", updated_at as "updated_at", created_by
      `, [productData.name, productData.category, productData.unit, productData.packaging,
          productData.purchase_price, productData.sale_price, productData.current_stock,
          productData.minimum_stock, productData.active, productData.created_by]);

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const client = await this.pool.connect();
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.category !== undefined) {
        fields.push(`category = $${paramCount++}`);
        values.push(updates.category);
      }
      if (updates.unit !== undefined) {
        fields.push(`unit = $${paramCount++}`);
        values.push(updates.unit);
      }
      if (updates.packaging !== undefined) {
        fields.push(`packaging = $${paramCount++}`);
        values.push(updates.packaging);
      }
      if (updates.purchase_price !== undefined) {
        fields.push(`purchase_price = $${paramCount++}`);
        values.push(updates.purchase_price);
      }
      if (updates.sale_price !== undefined) {
        fields.push(`sale_price = $${paramCount++}`);
        values.push(updates.sale_price);
      }
      if (updates.current_stock !== undefined) {
        fields.push(`current_stock = $${paramCount++}`);
        values.push(updates.current_stock);
      }
      if (updates.minimum_stock !== undefined) {
        fields.push(`minimum_stock = $${paramCount++}`);
        values.push(updates.minimum_stock);
      }
      if (updates.active !== undefined) {
        fields.push(`active = $${paramCount++}`);
        values.push(updates.active);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(`
        UPDATE mascate_pro.products
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, category, unit, packaging, purchase_price, sale_price,
                  current_stock, minimum_stock, active,
                  created_at as "created_at", updated_at as "updated_at", created_by
      `, values);

      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at?.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE mascate_pro.products
        SET active = false, updated_at = NOW()
        WHERE id = $1
      `, [id]);
    } finally {
      client.release();
    }
  }

  // Stock movement methods
  async getStockMovements(): Promise<StockMovement[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, product_id, movement_type, quantity, previous_stock, new_stock,
               unit_price, total_value, notes, created_at as "created_at", created_by
        FROM mascate_pro.stock_movements
        ORDER BY created_at DESC
        LIMIT 100
      `);

      return result.rows.map(row => ({
        ...row,
        created_at: row.created_at.toISOString(),
      }));
    } finally {
      client.release();
    }
  }

  async createStockMovement(movementData: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO mascate_pro.stock_movements (product_id, movement_type, quantity, previous_stock,
                                               new_stock, unit_price, total_value, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, product_id, movement_type, quantity, previous_stock, new_stock,
                  unit_price, total_value, notes, created_at as "created_at", created_by
      `, [movementData.product_id, movementData.movement_type, movementData.quantity,
          movementData.previous_stock, movementData.new_stock, movementData.unit_price,
          movementData.total_value, movementData.notes, movementData.created_by]);

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  // Activity log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, user_id, action, details, ip_address, user_agent, created_at as "created_at"
        FROM mascate_pro.activity_logs
        ORDER BY created_at DESC
        LIMIT 100
      `);

      return result.rows.map(row => ({
        ...row,
        created_at: row.created_at.toISOString(),
      }));
    } finally {
      client.release();
    }
  }

  async createActivityLog(logData: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO mascate_pro.activity_logs (user_id, action, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, action, details, ip_address, user_agent, created_at as "created_at"
      `, [logData.user_id, logData.action, logData.details, logData.ip_address, logData.user_agent]);

      const row = result.rows[0];
      return {
        ...row,
        created_at: row.created_at.toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async exportDatabase(): Promise<Uint8Array> {
    // Para PostgreSQL, exportar como JSON
    const client = await this.pool.connect();
    try {
      const [users, products, movements, logs] = await Promise.all([
        client.query('SELECT * FROM mascate_pro.users'),
        client.query('SELECT * FROM mascate_pro.products'),
        client.query('SELECT * FROM mascate_pro.stock_movements'),
        client.query('SELECT * FROM mascate_pro.activity_logs')
      ]);

      const exportData = {
        users: users.rows,
        products: products.rows,
        stock_movements: movements.rows,
        activity_logs: logs.rows,
        exported_at: new Date().toISOString(),
        source: 'postgresql'
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return new TextEncoder().encode(jsonString);

    } finally {
      client.release();
    }
  }

  async importDatabase(data: Uint8Array): Promise<void> {
    // Para PostgreSQL, importar seria mais complexo
    // Por enquanto, apenas log da tentativa
    const jsonString = new TextDecoder().decode(data);
    const importData = JSON.parse(jsonString);

    console.log('📥 Import solicitado:', {
      users: importData.users?.length || 0,
      products: importData.products?.length || 0,
      movements: importData.stock_movements?.length || 0,
      logs: importData.activity_logs?.length || 0
    });

    // TODO: Implementar import completo se necessário
    throw new Error('Import para PostgreSQL não implementado ainda');
  }
}

// Singleton instance
let dbService: PostgreSQLDatabaseService | null = null;

export const getDatabase = async (): Promise<DatabaseService> => {
  if (!dbService) {
    dbService = new PostgreSQLDatabaseService();
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
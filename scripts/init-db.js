#!/usr/bin/env node
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createInitialDatabase() {
  try {
    console.log('🔄 Creating initial SQLite database...');

    // Initialize SQL.js with WASM file
    const wasmPath = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);

    const SQL = await initSqlJs({
      wasmBinary: wasmBuffer
    });

    // Create new database
    const db = new SQL.Database();

    // Create schema
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

    db.exec(schema);
    console.log('✅ Database schema created');

    // Seed initial data
    const adminId = uuidv4();
    const now = new Date().toISOString();

    // Create admin user
    db.run(`
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
      db.run(`
        INSERT INTO products (id, name, category, unit, packaging, purchase_price, sale_price, current_stock, minimum_stock, active, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [product.id, product.name, product.category, product.unit, product.packaging, product.purchase_price, product.sale_price, product.current_stock, product.minimum_stock, 1, now, adminId]);
    }

    // Log initialization
    db.run(`
      INSERT INTO activity_logs (id, user_id, action, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), adminId, 'SYSTEM_INIT', 'Sistema inicializado com dados de exemplo', '127.0.0.1', 'Node.js Script', now]);

    console.log('✅ Initial data seeded');

    // Export database to file
    const data = db.export();
    const dbPath = path.join(__dirname, '../public/mascate_stock.db');

    fs.writeFileSync(dbPath, data);
    console.log(`✅ Database saved to: ${dbPath}`);

    db.close();
    console.log('✅ Initial database creation completed!');

  } catch (error) {
    console.error('❌ Failed to create initial database:', error);
    process.exit(1);
  }
}

createInitialDatabase();
#!/usr/bin/env node
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Client } = pg;

// Configuração da conexão
const config = {
  user: 'postgres',
  password: '4c6c4d5fb548a9cb',
  host: 'postgres.platform.sinesys.app',
  port: 15432,  // Porta correta mapeada no Capover
  database: 'postgres',
  ssl: false,   // Servidor não suporta SSL
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000
};

async function setupDatabase() {
  let client;

  try {
    console.log('🔄 Conectando ao PostgreSQL...');
    client = new Client(config);
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL com sucesso!');

    // Criar schema para o Mascate Pro
    console.log('🔄 Criando schema mascate_pro...');

    await client.query(`
      CREATE SCHEMA IF NOT EXISTS mascate_pro;
    `);

    console.log('✅ Schema mascate_pro criado!');

    // Criar tabelas
    console.log('🔄 Criando tabelas...');

    const createTables = `
      -- Users table
      CREATE TABLE IF NOT EXISTS mascate_pro.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        avatar_id VARCHAR(100),
        role VARCHAR(20) NOT NULL CHECK(role IN ('superadmin', 'admin', 'user')),
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS mascate_pro.products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        packaging TEXT,
        purchase_price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2) NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        minimum_stock INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE,
        created_by UUID NOT NULL REFERENCES mascate_pro.users(id)
      );

      -- Stock movements table
      CREATE TABLE IF NOT EXISTS mascate_pro.stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES mascate_pro.products(id),
        movement_type VARCHAR(20) NOT NULL CHECK(movement_type IN ('sale', 'purchase', 'adjustment', 'return', 'loss')),
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        unit_price DECIMAL(10,2),
        total_value DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_by UUID NOT NULL REFERENCES mascate_pro.users(id)
      );

      -- Activity logs table
      CREATE TABLE IF NOT EXISTS mascate_pro.activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES mascate_pro.users(id),
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

    await client.query(createTables);
    console.log('✅ Tabelas criadas!');

    // Criar índices
    console.log('🔄 Criando índices...');

    const createIndexes = `
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON mascate_pro.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON mascate_pro.users(username);
      CREATE INDEX IF NOT EXISTS idx_users_active ON mascate_pro.users(active);

      CREATE INDEX IF NOT EXISTS idx_products_name ON mascate_pro.products(name);
      CREATE INDEX IF NOT EXISTS idx_products_category ON mascate_pro.products(category);
      CREATE INDEX IF NOT EXISTS idx_products_active ON mascate_pro.products(active);
      CREATE INDEX IF NOT EXISTS idx_products_stock_low ON mascate_pro.products(current_stock, minimum_stock);

      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON mascate_pro.stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON mascate_pro.stock_movements(created_at);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON mascate_pro.stock_movements(movement_type);

      CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON mascate_pro.activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON mascate_pro.activity_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON mascate_pro.activity_logs(action);
    `;

    await client.query(createIndexes);
    console.log('✅ Índices criados!');

    // Verificar se já existem dados
    const userCheck = await client.query('SELECT COUNT(*) FROM mascate_pro.users');
    const userCount = parseInt(userCheck.rows[0].count);

    if (userCount === 0) {
      console.log('🔄 Inserindo dados iniciais...');

      // Inserir usuário admin
      const adminResult = await client.query(`
        INSERT INTO mascate_pro.users (username, email, display_name, avatar_id, role, active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['admin', 'admin@mascate.com', 'Administrador', 'admin-male-1', 'superadmin', true]);

      const adminId = adminResult.rows[0].id;
      console.log(`✅ Usuário admin criado com ID: ${adminId}`);

      // Inserir produtos de exemplo
      const products = [
        {
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
        await client.query(`
          INSERT INTO mascate_pro.products (name, category, unit, packaging, purchase_price, sale_price, current_stock, minimum_stock, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [product.name, product.category, product.unit, product.packaging, product.purchase_price, product.sale_price, product.current_stock, product.minimum_stock, adminId]);
      }

      console.log('✅ Produtos de exemplo criados!');

      // Log de inicialização
      await client.query(`
        INSERT INTO mascate_pro.activity_logs (user_id, action, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `, [adminId, 'SYSTEM_INIT', 'Sistema inicializado com dados de exemplo no PostgreSQL', '127.0.0.1', 'Node.js Setup Script']);

      console.log('✅ Log de inicialização criado!');
    } else {
      console.log(`ℹ️  Banco já possui ${userCount} usuários, pulando inserção de dados iniciais.`);
    }

    // Mostrar estatísticas
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM mascate_pro.users) as users,
        (SELECT COUNT(*) FROM mascate_pro.products) as products,
        (SELECT COUNT(*) FROM mascate_pro.stock_movements) as movements,
        (SELECT COUNT(*) FROM mascate_pro.activity_logs) as logs
    `);

    console.log('\n📊 Estatísticas do banco:');
    console.log(`👥 Usuários: ${stats.rows[0].users}`);
    console.log(`📦 Produtos: ${stats.rows[0].products}`);
    console.log(`📊 Movimentações: ${stats.rows[0].movements}`);
    console.log(`📝 Logs: ${stats.rows[0].logs}`);

    console.log('\n✅ Setup do PostgreSQL concluído com sucesso!');
    console.log('\n🔗 Detalhes da conexão:');
    console.log(`Host: ${config.host}`);
    console.log(`Database: ${config.database}`);
    console.log(`Schema: mascate_pro`);

  } catch (error) {
    console.error('❌ Erro no setup do PostgreSQL:', error.message);
    if (error.code) {
      console.error(`Código do erro: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Conexão fechada.');
    }
  }
}

setupDatabase();
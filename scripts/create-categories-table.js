import pkg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pkg;

// Database configuration
const poolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '4c6c4d5fb548a9cb',
  host: process.env.POSTGRES_HOST || 'postgres.platform.sinesys.app',
  port: parseInt(process.env.POSTGRES_PORT || '15432'),
  database: process.env.POSTGRES_DB || 'postgres',
  ssl: process.env.POSTGRES_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
};

const pool = new Pool(poolConfig);

async function createCategoriesTable() {
  const client = await pool.connect();

  try {
    console.log('🔄 Conectando ao banco de dados...');
    console.log(`📍 Host: ${poolConfig.host}:${poolConfig.port}`);
    console.log(`🗄️ Database: ${poolConfig.database}`);

    // Test connection
    const testResult = await client.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso!');

    // Check if table already exists
    console.log('\n🔍 Verificando se a tabela categories existe...');
    const checkTable = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'mascate_pro'
      AND table_name = 'categories'
    `);

    if (checkTable.rows.length > 0) {
      console.log('⚠️ Tabela categories já existe');
    } else {
      console.log('📝 Criando tabela categories...');

      // Create categories table
      await client.query(`
        CREATE TABLE mascate_pro.categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          color VARCHAR(20),
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by UUID NOT NULL,
          FOREIGN KEY (created_by) REFERENCES mascate_pro.users(id)
        )
      `);

      console.log('✅ Tabela categories criada com sucesso!');

      // Create indexes
      console.log('📝 Criando índices...');
      await client.query(`
        CREATE INDEX idx_categories_name ON mascate_pro.categories(name);
        CREATE INDEX idx_categories_active ON mascate_pro.categories(active);
      `);
      console.log('✅ Índices criados com sucesso!');

      // Create trigger for updated_at
      console.log('📝 Criando trigger para updated_at...');

      // First check if the trigger function exists
      const checkFunction = await client.query(`
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'mascate_pro'
        AND routine_name = 'update_updated_at_column'
      `);

      if (checkFunction.rows.length === 0) {
        // Create the trigger function if it doesn't exist
        await client.query(`
          CREATE OR REPLACE FUNCTION mascate_pro.update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';
        `);
      }

      // Create the trigger
      await client.query(`
        CREATE TRIGGER update_categories_updated_at
        BEFORE UPDATE ON mascate_pro.categories
        FOR EACH ROW
        EXECUTE FUNCTION mascate_pro.update_updated_at_column()
      `);

      console.log('✅ Trigger criado com sucesso!');

      // Insert default categories
      console.log('📝 Inserindo categorias padrão...');

      // Get admin user ID
      const adminUser = await client.query(`
        SELECT id FROM mascate_pro.users
        WHERE email = 'admin@mascate.com' OR email = 'admin@mascate.com.br'
        LIMIT 1
      `);

      if (adminUser.rows.length > 0) {
        const adminId = adminUser.rows[0].id;

        await client.query(`
          INSERT INTO mascate_pro.categories (name, description, icon, color, created_by)
          VALUES
          ('Bebidas Alcoólicas', 'Cervejas, vinhos, destilados e outras bebidas com álcool', '🍺', '#f59e0b', $1),
          ('Bebidas Não Alcoólicas', 'Refrigerantes, sucos, águas e energéticos', '🥤', '#3b82f6', $1),
          ('Petiscos', 'Salgadinhos, amendoins e outros aperitivos', '🍿', '#ef4444', $1),
          ('Cigarros', 'Cigarros e produtos de tabaco', '🚬', '#6b7280', $1),
          ('Doces', 'Balas, chocolates e guloseimas', '🍬', '#ec4899', $1),
          ('Gelo', 'Gelo em cubos e barras', '🧊', '#06b6d4', $1),
          ('Diversos', 'Outros produtos não categorizados', '📦', '#9333ea', $1)
          ON CONFLICT (name) DO NOTHING
        `, [adminId]);

        console.log('✅ Categorias padrão inseridas com sucesso!');
      } else {
        console.log('⚠️ Nenhum usuário admin encontrado, pulando inserção de categorias padrão');
      }
    }

    // Verify the table structure
    const verifyTable = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro'
      AND table_name = 'categories'
      ORDER BY ordinal_position
    `);

    if (verifyTable.rows.length > 0) {
      console.log('\n✅ Estrutura da tabela categories:');
      verifyTable.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Count categories
    const countCategories = await client.query(`
      SELECT COUNT(*) as total FROM mascate_pro.categories
    `);
    console.log(`\n📊 Total de categorias: ${countCategories.rows[0].total}`);

  } catch (error) {
    console.error('❌ Erro durante a criação da tabela:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Run migration
console.log('🗄️ Migração do Banco de Dados - Criar tabela categories');
console.log('='.repeat(60));

createCategoriesTable()
  .then(() => {
    console.log('\n✅ Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na migração:', error);
    process.exit(1);
  });
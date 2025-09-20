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
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'postgres',
  ssl: process.env.POSTGRES_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
};

const pool = new Pool(poolConfig);

const migrations = [
  {
    name: 'Enable UUID extension',
    sql: `
      -- Enable UUID extension if not exists (try both methods)
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `
  },
  {
    name: 'Add configurations table',
    sql: `
      -- Configuration table (using gen_random_uuid which is built-in PostgreSQL 13+)
      CREATE TABLE IF NOT EXISTS mascate_pro.configurations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key VARCHAR(100) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by UUID NOT NULL,
          FOREIGN KEY (created_by) REFERENCES mascate_pro.users(id)
      );
    `
  },
  {
    name: 'Add configurations indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_configurations_key ON mascate_pro.configurations(key);
      CREATE INDEX IF NOT EXISTS idx_configurations_active ON mascate_pro.configurations(active);
    `
  },
  {
    name: 'Add configurations trigger',
    sql: `
      -- Drop trigger if exists and recreate
      DROP TRIGGER IF EXISTS update_configurations_updated_at ON mascate_pro.configurations;
      CREATE TRIGGER update_configurations_updated_at
      BEFORE UPDATE ON mascate_pro.configurations
      FOR EACH ROW EXECUTE FUNCTION mascate_pro.update_updated_at_column();
    `
  },
  {
    name: 'Insert default business configurations',
    sql: `
      INSERT INTO mascate_pro.configurations (key, value, description, created_by)
      VALUES
      ('business_rules', '{"lowStockThreshold": 10, "criticalStockThreshold": 5, "autoReorderEnabled": false, "notificationsEnabled": true, "workingHours": {"start": "18:00", "end": "04:00"}, "maxDailyStock": 1000}', 'Configurações de regras de negócio e alertas', (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com')),
      ('backup_config', '{"autoBackupEnabled": true, "backupInterval": "daily", "maxBackups": 30, "lastBackup": null}', 'Configurações de backup automático', (SELECT id FROM mascate_pro.users WHERE email = 'admin@mascate.com'))
      ON CONFLICT (key) DO NOTHING;
    `
  }
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Conectando ao banco de dados...');
    console.log(`📍 Host: ${poolConfig.host}:${poolConfig.port}`);
    console.log(`🗄️ Database: ${poolConfig.database}`);
    console.log(`🔐 SSL: ${poolConfig.ssl ? 'Habilitado' : 'Desabilitado'}`);

    // Test connection
    const testResult = await client.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log(`⏰ Timestamp do servidor: ${testResult.rows[0].now}`);

    console.log('\n🚀 Executando migrações...\n');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`📝 [${i + 1}/${migrations.length}] ${migration.name}...`);

      try {
        await client.query(migration.sql);
        console.log(`✅ Concluída: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Erro na migração "${migration.name}":`, error.message);

        // Continue with other migrations unless it's a critical error
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log(`⚠️ Ignorando erro (já existe): ${migration.name}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Todas as migrações foram executadas com sucesso!');

    // Verify the new table exists
    console.log('\n🔍 Verificando estrutura criada...');
    const checkTable = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro' AND table_name = 'configurations'
      ORDER BY ordinal_position;
    `);

    if (checkTable.rows.length > 0) {
      console.log('✅ Tabela configurations criada com colunas:');
      checkTable.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ Tabela configurations não foi criada');
    }

    // Check configurations data
    const configCheck = await client.query('SELECT key, description FROM mascate_pro.configurations');
    console.log(`✅ Configurações inseridas: ${configCheck.rows.length} registros`);
    configCheck.rows.forEach(row => {
      console.log(`   - ${row.key}: ${row.description}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Run migrations
console.log('🗄️ Migração do Banco de Dados - Sistema de Configurações');
console.log('='.repeat(60));

runMigrations()
  .then(() => {
    console.log('\n✅ Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na migração:', error);
    process.exit(1);
  });
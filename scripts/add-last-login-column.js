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

async function addLastLoginColumn() {
  const client = await pool.connect();

  try {
    console.log('🔄 Conectando ao banco de dados...');
    console.log(`📍 Host: ${poolConfig.host}:${poolConfig.port}`);
    console.log(`🗄️ Database: ${poolConfig.database}`);

    // Test connection
    const testResult = await client.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso!');

    // Check if column already exists
    console.log('\n🔍 Verificando se a coluna last_login existe...');
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro'
      AND table_name = 'users'
      AND column_name = 'last_login'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⚠️ Coluna last_login já existe na tabela users');
    } else {
      console.log('📝 Adicionando coluna last_login à tabela users...');

      await client.query(`
        ALTER TABLE mascate_pro.users
        ADD COLUMN last_login TIMESTAMP WITH TIME ZONE
      `);

      console.log('✅ Coluna last_login adicionada com sucesso!');
    }

    // Verify the column was added
    const verifyColumn = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro'
      AND table_name = 'users'
      AND column_name = 'last_login'
    `);

    if (verifyColumn.rows.length > 0) {
      console.log('\n✅ Verificação concluída:');
      console.log(`   - Coluna: ${verifyColumn.rows[0].column_name}`);
      console.log(`   - Tipo: ${verifyColumn.rows[0].data_type}`);
      console.log(`   - Nullable: ${verifyColumn.rows[0].is_nullable}`);
    }

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Run migration
console.log('🗄️ Migração do Banco de Dados - Adicionar coluna last_login');
console.log('='.repeat(60));

addLastLoginColumn()
  .then(() => {
    console.log('\n✅ Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na migração:', error);
    process.exit(1);
  });
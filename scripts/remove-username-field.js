import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const poolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '4c6c4d5fb548a9cb',
  host: process.env.POSTGRES_HOST || 'postgres.platform.sinesys.app',
  port: parseInt(process.env.POSTGRES_PORT || '15432'),
  database: process.env.POSTGRES_DB || 'postgres',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

async function removeUsernameField() {
  const client = await pool.connect();

  try {
    console.log('🔄 Removendo campo username da tabela users...');
    console.log('='.repeat(60));

    await client.query('BEGIN');

    // Check if username column exists
    const checkColumn = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro'
      AND table_name = 'users'
      AND column_name = 'username'
    `);

    if (checkColumn.rows.length > 0) {
      // First, remove the UNIQUE constraint if it exists
      console.log('🔧 Removendo constraint UNIQUE do username...');
      await client.query(`
        ALTER TABLE mascate_pro.users
        DROP CONSTRAINT IF EXISTS users_username_key
      `);

      // Remove the username column
      console.log('🗑️ Removendo coluna username...');
      await client.query(`
        ALTER TABLE mascate_pro.users
        DROP COLUMN username
      `);

      console.log('✅ Coluna username removida com sucesso!');
    } else {
      console.log('⚠️ Coluna username já foi removida anteriormente');
    }

    // Commit the changes
    await client.query('COMMIT');

    // Show new structure
    console.log('\n📊 Nova estrutura da tabela users:');
    const newColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro' AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    newColumns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('📝 Agora o email é usado como identificador único para login');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

removeUsernameField().catch(console.error);
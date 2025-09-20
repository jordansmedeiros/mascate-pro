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

async function checkStructure() {
  const client = await pool.connect();

  try {
    console.log('📊 Estrutura da tabela users:');
    console.log('='.repeat(60));

    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro' AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    console.log('\n📋 Dados atuais dos usuários:');
    const users = await client.query(`
      SELECT id, username, email, display_name, role, active
      FROM mascate_pro.users
    `);

    users.rows.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Display Name: ${user.display_name}`);
      console.log(`  Role: ${user.role}`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

checkStructure().catch(console.error);
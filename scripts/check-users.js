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

async function checkUsers() {
  const client = await pool.connect();

  try {
    console.log('🔍 Verificando usuários no banco...');

    const result = await client.query(`
      SELECT id, email, display_name, role, active
      FROM mascate_pro.users
      ORDER BY role, email
    `);

    console.log('👥 Usuários encontrados:');
    result.rows.forEach(user => {
      console.log(`- ${user.email} | ${user.display_name} | Role: ${user.role} | Ativo: ${user.active}`);
    });

    const superadmins = result.rows.filter(u => u.role === 'superadmin' && u.active);
    console.log(`\n🎯 Superadmins ativos: ${superadmins.length}`);

    if (superadmins.length === 0) {
      console.log('⚠️ PROBLEMA: Nenhum superadmin ativo encontrado!');

      const admins = result.rows.filter(u => u.role === 'admin' && u.active);
      console.log(`📋 Admins ativos: ${admins.length}`);

      if (admins.length > 0) {
        console.log('💡 Sugestão: Promover um admin para superadmin');
      }
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers().catch(console.error);

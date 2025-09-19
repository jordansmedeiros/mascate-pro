#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

async function checkUsers() {
  const client = new Client({
    user: 'postgres',
    password: '4c6c4d5fb548a9cb',
    host: 'postgres.platform.sinesys.app',
    port: 15432,
    database: 'postgres',
    ssl: false,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('🔍 Verificando usuários no banco...');

    const result = await client.query(`
      SELECT id, username, email, display_name, role, active, created_at
      FROM mascate_pro.users
      ORDER BY created_at ASC
    `);

    if (result.rows.length === 0) {
      console.log('❌ NENHUM USUÁRIO ENCONTRADO!');
      console.log('');
      console.log('🔧 Execute: node scripts/setup-postgresql.js');
      console.log('   Para criar o usuário admin padrão');
    } else {
      console.log(`✅ Encontrados ${result.rows.length} usuário(s):`);
      console.log('');
      result.rows.forEach((user, index) => {
        console.log(`👤 ${index + 1}. ${user.username} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.active}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.created_at.toISOString()}`);
        console.log('');
      });

      // Mostrar credenciais de login
      const adminUser = result.rows.find(user => user.role === 'superadmin');
      if (adminUser) {
        console.log('🔑 CREDENCIAIS DE LOGIN:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Senha: NÃO DEFINIDA (precisamos implementar autenticação!)`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
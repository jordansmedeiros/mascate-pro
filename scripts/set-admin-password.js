#!/usr/bin/env node
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function setAdminPassword() {
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
    console.log('🔄 Definindo senha para usuário admin...');

    // Senha padrão para o admin
    const adminPassword = 'admin123';
    const saltRounds = 12;

    // Gerar hash da senha
    console.log('🔐 Gerando hash da senha...');
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Atualizar usuário admin
    const result = await client.query(`
      UPDATE mascate_pro.users
      SET password_hash = $1, updated_at = NOW()
      WHERE email = 'admin@mascate.com'
      RETURNING id, username, email, display_name, role
    `, [passwordHash]);

    if (result.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    const admin = result.rows[0];
    console.log('✅ Senha definida com sucesso!');
    console.log('');
    console.log('👤 Usuário atualizado:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.display_name}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('🔑 CREDENCIAIS DE LOGIN:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere esta senha após o primeiro login!');

    // Log da atividade
    await client.query(`
      INSERT INTO mascate_pro.activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [admin.id, 'PASSWORD_SET', 'Senha padrão definida pelo script de setup', '127.0.0.1', 'Setup Script']);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

setAdminPassword();
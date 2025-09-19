#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

async function addPasswordField() {
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
    console.log('🔄 Adicionando campo password_hash na tabela users...');

    // Adicionar campo password_hash
    await client.query(`
      ALTER TABLE mascate_pro.users
      ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `);

    console.log('✅ Campo password_hash adicionado com sucesso!');

    // Verificar estrutura da tabela
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'mascate_pro' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Estrutura atual da tabela users:');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

addPasswordField();
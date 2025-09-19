#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

async function testConnection() {
  console.log('🔄 Testando conexão PostgreSQL na porta 15432...');

  const client = new Client({
    user: 'postgres',
    password: '4c6c4d5fb548a9cb',
    host: 'postgres.platform.sinesys.app',
    port: 15432,
    database: 'postgres',
    ssl: false,  // Desabilitado pois o servidor não suporta SSL
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ CONEXÃO ESTABELECIDA!');

    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log(`📊 PostgreSQL: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`📂 Database: ${result.rows[0].current_database}`);
    console.log(`👤 User: ${result.rows[0].current_user}`);

    // Listar schemas
    const schemas = await client.query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    console.log(`📁 Schemas: ${schemas.rows.map(r => r.schema_name).join(', ')}`);

    await client.end();
    console.log('🎉 TESTE BEM-SUCEDIDO! Pronto para criar o schema.');

  } catch (error) {
    console.log(`❌ FALHA: ${error.message}`);
    console.log(`🔍 Código: ${error.code || 'N/A'}`);
  }
}

testConnection();
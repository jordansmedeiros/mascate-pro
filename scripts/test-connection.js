#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

async function testConnection() {
  const configs = [
    // Configuração 1: Porta 5432 com SSL
    {
      name: 'Porta 5432 com SSL',
      user: 'postgres',
      password: '4c6c4d5fb548a9cb',
      host: 'postgres.platform.sinesys.app',
      port: 5432,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    },
    // Configuração 2: Porta 5432 sem SSL
    {
      name: 'Porta 5432 sem SSL',
      user: 'postgres',
      password: '4c6c4d5fb548a9cb',
      host: 'postgres.platform.sinesys.app',
      port: 5432,
      database: 'postgres',
      ssl: false
    },
    // Configuração 3: Porta 5433
    {
      name: 'Porta 5433 com SSL',
      user: 'postgres',
      password: '4c6c4d5fb548a9cb',
      host: 'postgres.platform.sinesys.app',
      port: 5433,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    },
    // Configuração 4: URL de conexão
    {
      name: 'URL de conexão',
      connectionString: 'postgresql://postgres:4c6c4d5fb548a9cb@postgres.platform.sinesys.app:5432/postgres?sslmode=require'
    },
    // Configuração 5: Sem especificar porta
    {
      name: 'Sem porta específica',
      user: 'postgres',
      password: '4c6c4d5fb548a9cb',
      host: 'postgres.platform.sinesys.app',
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (const config of configs) {
    console.log(`\n🔄 Testando: ${config.name}`);

    let client;
    try {
      client = new Client(config);
      await client.connect();

      // Testar query simples
      const result = await client.query('SELECT version(), current_database(), current_user');
      console.log('✅ Conexão bem-sucedida!');
      console.log(`   PostgreSQL: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
      console.log(`   Database: ${result.rows[0].current_database}`);
      console.log(`   User: ${result.rows[0].current_user}`);

      // Listar schemas existentes
      const schemas = await client.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
      `);

      console.log(`   Schemas disponíveis: ${schemas.rows.map(r => r.schema_name).join(', ')}`);

      await client.end();

      console.log('\n✅ Esta configuração funciona! Usar esta para o setup.');
      process.exit(0);

    } catch (error) {
      console.log(`❌ Falhou: ${error.message}`);
      if (error.code) {
        console.log(`   Código: ${error.code}`);
      }
      if (client) {
        try {
          await client.end();
        } catch (closeError) {
          // Ignore close errors
        }
      }
    }
  }

  console.log('\n❌ Nenhuma configuração funcionou. Verifique:');
  console.log('   - Host está correto: postgres.platform.sinesys.app');
  console.log('   - Porta está aberta (5432 ou outra)');
  console.log('   - Credenciais estão corretas');
  console.log('   - Firewall permite conexões externas');
  console.log('   - SSL/TLS está configurado corretamente');
}

testConnection();
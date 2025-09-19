#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

async function scanPorts() {
  const host = 'postgres.platform.sinesys.app';
  const user = 'postgres';
  const password = '4c6c4d5fb548a9cb';
  const database = 'postgres';

  // Portas comuns para PostgreSQL
  const ports = [
    5432,  // Padrão PostgreSQL
    5433,  // Alternativa comum
    5434,  // Alternativa
    5435,  // Alternativa
    25060, // Supabase/managed
    26257, // CockroachDB (compatível)
    54321, // Inverso
    15432, // Com prefixo
    35432, // Com prefixo
    45432, // Com prefixo
    55432  // Com prefixo
  ];

  console.log(`🔍 Escaneando portas em ${host}...`);
  console.log(`📝 Usuário: ${user}`);
  console.log(`📊 Database: ${database}\n`);

  for (const port of ports) {
    process.stdout.write(`⏳ Testando porta ${port}... `);

    try {
      const client = new Client({
        user,
        password,
        host,
        port,
        database,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      await client.connect();

      // Testar query simples
      const result = await client.query('SELECT version(), current_database()');

      await client.end();

      console.log('✅ SUCESSO!');
      console.log(`\n🎉 PORTA ENCONTRADA: ${port}`);
      console.log(`📊 PostgreSQL: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
      console.log(`📂 Database: ${result.rows[0].current_database}`);
      console.log(`\n🔗 String de conexão:`);
      console.log(`postgresql://${user}:${password}@${host}:${port}/${database}`);

      return port;

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Recusada');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('⏰ Timeout');
      } else {
        console.log(`❌ Erro: ${error.code || error.message}`);
      }
    }
  }

  console.log('\n❌ Nenhuma porta funcionou.');
  console.log('\n💡 Verificar no Capover:');
  console.log('   1. Vá no container PostgreSQL');
  console.log('   2. Procure "Port Mapping" ou "Portas"');
  console.log('   3. Deve mostrar: EXTERNA:5432');
  console.log('   4. Use a porta EXTERNA no script');
}

scanPorts();
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

async function cleanDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Conectando ao banco de dados...');
    console.log(`📍 Host: ${poolConfig.host}:${poolConfig.port}`);
    console.log(`🗄️ Database: ${poolConfig.database}`);
    console.log(`⚠️ AVISO: Este script irá DELETAR TODOS OS DADOS exceto usuários!`);
    console.log('='.repeat(60));

    // Test connection
    const testResult = await client.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log(`⏰ Timestamp do servidor: ${testResult.rows[0].now}`);

    // Start transaction
    await client.query('BEGIN');
    console.log('\n🔄 Iniciando limpeza do banco de dados...\n');

    // 1. Delete activity logs
    console.log('🗑️ Limpando activity_logs...');
    const activityResult = await client.query('DELETE FROM mascate_pro.activity_logs');
    console.log(`   ✅ ${activityResult.rowCount} registros de atividade removidos`);

    // 2. Delete stock movements
    console.log('🗑️ Limpando stock_movements...');
    const movementsResult = await client.query('DELETE FROM mascate_pro.stock_movements');
    console.log(`   ✅ ${movementsResult.rowCount} movimentações removidas`);

    // 3. Delete products
    console.log('🗑️ Limpando products...');
    const productsResult = await client.query('DELETE FROM mascate_pro.products');
    console.log(`   ✅ ${productsResult.rowCount} produtos removidos`);

    // 4. Delete categories
    console.log('🗑️ Limpando categories...');
    const categoriesResult = await client.query('DELETE FROM mascate_pro.categories');
    console.log(`   ✅ ${categoriesResult.rowCount} categorias removidas`);

    // 5. Delete configurations (optional - uncomment if you want to clear configs too)
    console.log('🗑️ Limpando configurations...');
    const configResult = await client.query('DELETE FROM mascate_pro.configurations');
    console.log(`   ✅ ${configResult.rowCount} configurações removidas`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Limpeza concluída com sucesso!');

    // Show what's left
    console.log('\n📊 Dados restantes no banco:');

    const usersCount = await client.query('SELECT COUNT(*) as count FROM mascate_pro.users');
    console.log(`   👤 Usuários: ${usersCount.rows[0].count} (mantidos)`);

    const tablesCheck = await client.query(`
      SELECT
        'products' as table_name, COUNT(*) as count FROM mascate_pro.products
      UNION ALL
      SELECT
        'categories', COUNT(*) FROM mascate_pro.categories
      UNION ALL
      SELECT
        'stock_movements', COUNT(*) FROM mascate_pro.stock_movements
      UNION ALL
      SELECT
        'activity_logs', COUNT(*) FROM mascate_pro.activity_logs
      UNION ALL
      SELECT
        'configurations', COUNT(*) FROM mascate_pro.configurations
    `);

    console.log('\n📋 Contagem de registros por tabela:');
    tablesCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}: ${row.count} registros`);
    });

    // Re-insert default categories for convenience
    console.log('\n📝 Inserindo categorias padrão...');

    // Get admin user ID
    const adminUser = await client.query(`
      SELECT id FROM mascate_pro.users
      WHERE email IN ('admin@mascate.com', 'admin@mascate.com.br')
      LIMIT 1
    `);

    if (adminUser.rows.length > 0) {
      const adminId = adminUser.rows[0].id;

      await client.query(`
        INSERT INTO mascate_pro.categories (name, description, icon, color, created_by)
        VALUES
        ('Bebidas Alcoólicas', 'Cervejas, vinhos, destilados e outras bebidas com álcool', '🍺', '#f59e0b', $1),
        ('Bebidas Não Alcoólicas', 'Refrigerantes, sucos, águas e energéticos', '🥤', '#3b82f6', $1),
        ('Petiscos', 'Salgadinhos, amendoins e outros aperitivos', '🍿', '#ef4444', $1),
        ('Cigarros', 'Cigarros e produtos de tabaco', '🚬', '#6b7280', $1),
        ('Doces', 'Balas, chocolates e guloseimas', '🍬', '#ec4899', $1),
        ('Gelo', 'Gelo em cubos e barras', '🧊', '#06b6d4', $1),
        ('Diversos', 'Outros produtos não categorizados', '📦', '#9333ea', $1)
      `, [adminId]);

      console.log('   ✅ Categorias padrão inseridas');
    }

    // Re-insert default configurations
    console.log('\n📝 Inserindo configurações padrão...');

    if (adminUser.rows.length > 0) {
      const adminId = adminUser.rows[0].id;

      await client.query(`
        INSERT INTO mascate_pro.configurations (key, value, description, created_by)
        VALUES
        ('business_rules', '{
          "lowStockThreshold": 10,
          "criticalStockThreshold": 5,
          "autoReorderEnabled": false,
          "notificationsEnabled": true,
          "workingHours": {"start": "18:00", "end": "04:00"},
          "maxDailyStock": 1000
        }'::jsonb, 'Configurações de regras de negócio e alertas', $1),
        ('backup_config', '{
          "autoBackupEnabled": true,
          "backupInterval": "daily",
          "maxBackups": 30,
          "lastBackup": null
        }'::jsonb, 'Configurações de backup automático', $1)
        ON CONFLICT (key) DO NOTHING
      `, [adminId]);

      console.log('   ✅ Configurações padrão inseridas');
    }

  } catch (error) {
    console.error('\n❌ Erro durante a limpeza:', error);

    // Rollback on error
    await client.query('ROLLBACK');
    console.log('⚠️ Transação revertida devido ao erro');

    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Conexão com banco encerrada');
  }
}

// Run cleanup
console.log('🧹 Limpeza do Banco de Dados - Mascate Pro');
console.log('='.repeat(60));
console.log('⚠️  ATENÇÃO: Este script irá DELETAR TODOS OS DADOS!');
console.log('   (Exceto usuários)');
console.log('='.repeat(60));
console.log('');

// Add a 3-second delay to allow cancellation
console.log('Iniciando em 3 segundos... (Ctrl+C para cancelar)');
setTimeout(() => {
  cleanDatabase()
    .then(() => {
      console.log('\n🎉 Banco de dados limpo com sucesso!');
      console.log('✅ Você pode agora adicionar novos produtos sem movimentações');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na limpeza:', error);
      process.exit(1);
    });
}, 3000);
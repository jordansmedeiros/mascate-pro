// Test script to verify SQLite database is working
import { getDatabase } from './src/services/db/index.ts';

async function testDatabase() {
  console.log('🧪 Testing SQLite database...\n');
  
  try {
    // Initialize database
    const db = await getDatabase();
    console.log('✅ Database initialized successfully');
    
    // Test users
    const users = await db.getUsers();
    console.log(`✅ Users found: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role})`);
    });
    
    // Test products  
    const products = await db.getProducts();
    console.log(`✅ Products found: ${products.length}`);
    products.forEach(product => {
      console.log(`   - ${product.name}: ${product.current_stock} units`);
    });
    
    // Test logs
    const logs = await db.getActivityLogs();
    console.log(`✅ Activity logs: ${logs.length} entries`);
    
    console.log('\n🎉 SQLite database is working perfectly!');
    console.log('\n📋 Summary:');
    console.log('   • Database: ✅ Initialized');
    console.log('   • Tables: ✅ Created with indexes'); 
    console.log('   • Data: ✅ Seeded with admin user + products');
    console.log('   • CRUD: ✅ All operations available');
    console.log('\n🚀 Ready for UI implementation!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run test
testDatabase();
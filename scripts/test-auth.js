#!/usr/bin/env node

async function testAuth() {
  const baseUrl = 'http://localhost:3001/api';

  console.log('🔄 Testando autenticação...');

  try {
    // Teste 1: Login com credenciais corretas
    console.log('\n1️⃣ Testando login com credenciais corretas:');
    const response1 = await fetch(`${baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@mascate.com',
        password: 'admin123'
      }),
    });

    console.log(`   Status: ${response1.status}`);

    const responseText = await response1.text();
    console.log(`   Raw response: ${responseText.substring(0, 200)}...`);

    let result1;
    try {
      result1 = JSON.parse(responseText);
    } catch (e) {
      console.log(`   ❌ JSON Parse Error: ${e.message}`);
      return;
    }
    console.log(`   Success: ${result1.success}`);

    if (result1.success) {
      console.log(`   ✅ Login bem-sucedido!`);
      console.log(`   👤 Usuário: ${result1.user.username} (${result1.user.email})`);
      console.log(`   🎭 Role: ${result1.user.role}`);
    } else {
      console.log(`   ❌ Falha: ${result1.error}`);
    }

    // Teste 2: Login com senha incorreta
    console.log('\n2️⃣ Testando login com senha incorreta:');
    const response2 = await fetch(`${baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@mascate.com',
        password: 'senhaerrada'
      }),
    });

    const result2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    console.log(`   Success: ${result2.success}`);
    console.log(`   ❌ Erro esperado: ${result2.error}`);

    // Teste 3: Login com email inexistente
    console.log('\n3️⃣ Testando login com email inexistente:');
    const response3 = await fetch(`${baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'inexistente@teste.com',
        password: 'qualquersenha'
      }),
    });

    const result3 = await response3.json();
    console.log(`   Status: ${response3.status}`);
    console.log(`   Success: ${result3.success}`);
    console.log(`   ❌ Erro esperado: ${result3.error}`);

    console.log('\n✅ Teste de autenticação concluído!');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.log('\n💡 Verifique se:');
    console.log('   - O servidor está rodando (npm run dev)');
    console.log('   - A API está acessível em http://localhost:3001/api');
    console.log('   - As Vercel Functions estão funcionando');
  }
}

testAuth();
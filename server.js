import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do pool PostgreSQL para o servidor Express
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '4c6c4d5fb548a9cb',
  host: process.env.POSTGRES_HOST || 'srv-captain--postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'postgres',
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const app = express();
const PORT = process.env.PORT || 3002;

// CORS manual para garantir que funcione
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Express API server running' });
});

// Auth endpoint
app.post('/api/auth', async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário por email
    const userResult = await client.query(`
      SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
             role, active, password_hash, created_at, updated_at
      FROM mascate_pro.users
      WHERE email = $1 AND active = true
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    const user = userResult.rows[0];

    // Verificar se usuário tem senha definida
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'Senha não definida para este usuário. Contate o administrador.'
      });
    }

    // Verificar senha
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    // Atualizar último login
    await client.query(`
      UPDATE mascate_pro.users
      SET updated_at = NOW()
      WHERE id = $1
    `, [user.id]);

    // Log da atividade
    await client.query(`
      INSERT INTO mascate_pro.activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      'LOGIN',
      'Login realizado com sucesso',
      req.ip || req.connection?.remoteAddress || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    // Retornar dados do usuário (sem senha)
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarId: user.avatarId,
      role: user.role,
      active: user.active,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at?.toISOString(),
    };

    return res.status(200).json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    client.release();
  }
});

// Users endpoint
app.get('/api/users', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id, email } = req.query;

    if (id) {
      // Get user by ID
      const result = await client.query(`
        SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
               role, active, created_at, updated_at
        FROM mascate_pro.users
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(result.rows[0]);
    }

    if (email) {
      // Get user by email
      const result = await client.query(`
        SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
               role, active, created_at, updated_at
        FROM mascate_pro.users
        WHERE email = $1
      `, [email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(result.rows[0]);
    }

    // Get all users
    const result = await client.query(`
      SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
             role, active, created_at, updated_at
      FROM mascate_pro.users
      ORDER BY created_at DESC
    `);

    return res.json(result.rows);

  } catch (error) {
    console.error('Users error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Create user endpoint
app.post('/api/users', async (req, res) => {
  const client = await pool.connect();

  try {
    const { username, email, display_name, role, active } = req.body;

    if (!username || !email || !display_name) {
      return res.status(400).json({ error: 'Username, email e display_name são obrigatórios' });
    }

    const result = await client.query(`
      INSERT INTO mascate_pro.users (username, email, display_name, role, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, display_name as "displayName", avatar_id as "avatarId",
                role, active, created_at, updated_at
    `, [username, email, display_name, role || 'user', active !== false]);

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email ou username já existe' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Update user endpoint
app.put('/api/users', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['username', 'email', 'display_name', 'avatar_id', 'role', 'active'].includes(key)) {
        updateFields.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await client.query(`
      UPDATE mascate_pro.users
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, username, email, display_name as "displayName", avatar_id as "avatarId",
                role, active, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email ou username já existe' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Delete user endpoint
app.delete('/api/users', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const result = await client.query(`
      DELETE FROM mascate_pro.users
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.status(204).send();

  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({ error: 'Não é possível deletar usuário com produtos ou movimentações associadas' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Products endpoint
app.get('/api/products', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.query;

    if (id) {
      // Get product by ID
      const result = await client.query(`
        SELECT id, name, category, unit, packaging, purchase_price, sale_price,
               current_stock, minimum_stock, active, created_at, updated_at, created_by
        FROM mascate_pro.products
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Convert decimal fields to numbers
      const product = {
        ...result.rows[0],
        purchase_price: parseFloat(result.rows[0].purchase_price),
        sale_price: parseFloat(result.rows[0].sale_price)
      };

      return res.json(product);
    }

    // Get all products
    const result = await client.query(`
      SELECT id, name, category, unit, packaging, purchase_price, sale_price,
             current_stock, minimum_stock, active, created_at, updated_at, created_by
      FROM mascate_pro.products
      ORDER BY name ASC
    `);

    // Convert decimal fields to numbers
    const products = result.rows.map(product => ({
      ...product,
      purchase_price: parseFloat(product.purchase_price),
      sale_price: parseFloat(product.sale_price)
    }));

    return res.json(products);

  } catch (error) {
    console.error('Products error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Stock movements endpoint
app.get('/api/stock-movements', async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT sm.id, sm.product_id, sm.user_id, sm.type, sm.quantity, sm.price_per_unit,
             sm.total_value, sm.notes, sm.created_at,
             p.name as product_name,
             u.username as user_name
      FROM mascate_pro.stock_movements sm
      LEFT JOIN mascate_pro.products p ON sm.product_id = p.id
      LEFT JOIN mascate_pro.users u ON sm.user_id = u.id
      ORDER BY sm.created_at DESC
    `);

    return res.json(result.rows);

  } catch (error) {
    console.error('Stock movements error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Activity logs endpoint
app.get('/api/activity-logs', async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT al.id, al.user_id, al.action, al.details, al.ip_address, al.user_agent, al.created_at,
             u.username as user_name
      FROM mascate_pro.activity_logs al
      LEFT JOIN mascate_pro.users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 1000
    `);

    return res.json(result.rows);

  } catch (error) {
    console.error('Activity logs error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Catch-all handler: send back React's index.html file in production
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  // Handle SPA routing - serve index.html for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
    } else {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Express API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
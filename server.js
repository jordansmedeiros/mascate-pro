import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const { Pool } = pkg;

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detecta se está em produção ou desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuração SSL - usa SSL para conexões remotas (desenvolvimento com host externo)
// Em produção no CapRover não precisa de SSL (conexão interna)
const sslConfig = process.env.POSTGRES_SSL === 'true' ? {
  rejectUnauthorized: false, // Aceita certificados auto-assinados
  ssl: true
} : false;

// Configuração do pool PostgreSQL para o servidor Express
// Usa configurações diferentes baseadas no ambiente
const poolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '4c6c4d5fb548a9cb',
  host: process.env.POSTGRES_HOST || (isProduction ? 'srv-captain--postgres' : 'postgres.platform.sinesys.app'),
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'postgres',
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

// Log da configuração de conexão (sem expor senha)
console.log(`Database connection configured for ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} environment`);
console.log(`Connecting to: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
console.log(`SSL: ${poolConfig.ssl ? 'Enabled' : 'Disabled'}`);

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
  console.log('Auth request received:', req.body.email);

  let client;
  try {
    client = await pool.connect();
    console.log('Database connection successful');
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    return res.status(500).json({
      success: false,
      error: 'Erro ao conectar ao banco de dados'
    });
  }

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
      SELECT id, email, display_name as "displayName", avatar_id as "avatarId",
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
  console.log('GET /api/users request received');

  let client;
  try {
    client = await pool.connect();
    console.log('Database connection successful for users endpoint');
  } catch (dbError) {
    console.error('Database connection error for users endpoint:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { id, email } = req.query;

    if (id) {
      // Get user by ID
      const result = await client.query(`
        SELECT id, email, display_name as "displayName", avatar_id as "avatarId",
               role, active, last_login, created_at, updated_at
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
        SELECT id, email, display_name as "displayName", avatar_id as "avatarId",
               role, active, last_login, created_at, updated_at
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
      SELECT id, email, display_name as "displayName", avatar_id as "avatarId",
             role, active, last_login, created_at, updated_at
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
    const { email, display_name, password, role, active } = req.body;

    if (!email || !display_name || !password) {
      return res.status(400).json({ error: 'Email, display_name e senha são obrigatórios' });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await client.query(`
      INSERT INTO mascate_pro.users (email, display_name, password_hash, role, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, display_name as "displayName", avatar_id as "avatarId",
                role, active, created_at, updated_at
    `, [email, display_name, password_hash, role || 'user', active !== false]);

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email já existe' });
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

    // Map camelCase to snake_case for database fields
    const fieldMap = {
      'displayName': 'display_name',
      'avatarId': 'avatar_id',
      'lastLogin': 'last_login'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key; // Convert camelCase to snake_case
      if (['email', 'display_name', 'avatar_id', 'role', 'active', 'last_login'].includes(dbField)) {
        updateFields.push(`${dbField} = $${valueIndex}`);
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
      RETURNING id, email, display_name as "displayName", avatar_id as "avatarId",
                role, active, last_login, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email já existe' });
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

// Create product endpoint
app.post('/api/products', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      category,
      unit,
      packaging,
      purchase_price,
      sale_price,
      current_stock,
      minimum_stock,
      created_by
    } = req.body;

    // Validate required fields
    if (!name || !category || !unit || !packaging) {
      return res.status(400).json({ error: 'Nome, categoria, unidade e embalagem são obrigatórios' });
    }

    // Get a user ID for created_by (if not provided, use first admin)
    let creatorId = created_by;
    if (!creatorId) {
      const adminResult = await client.query(`
        SELECT id FROM mascate_pro.users
        WHERE role IN ('admin', 'superadmin')
        LIMIT 1
      `);
      creatorId = adminResult.rows[0]?.id;
    }

    const result = await client.query(`
      INSERT INTO mascate_pro.products (
        name, category, unit, packaging, purchase_price,
        sale_price, current_stock, minimum_stock, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, category, unit, packaging, purchase_price, sale_price,
                current_stock, minimum_stock, active, created_at, updated_at, created_by
    `, [
      name,
      category,
      unit,
      packaging,
      purchase_price || 0,
      sale_price || 0,
      current_stock || 0,
      minimum_stock || 10,
      creatorId
    ]);

    // Convert decimal fields to numbers
    const product = {
      ...result.rows[0],
      purchase_price: parseFloat(result.rows[0].purchase_price),
      sale_price: parseFloat(result.rows[0].sale_price)
    };

    return res.status(201).json(product);

  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Produto com este nome já existe' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Update product endpoint
app.put('/api/products', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'category', 'unit', 'packaging', 'purchase_price',
           'sale_price', 'current_stock', 'minimum_stock', 'active'].includes(key)) {
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
      UPDATE mascate_pro.products
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, name, category, unit, packaging, purchase_price, sale_price,
                current_stock, minimum_stock, active, created_at, updated_at, created_by
    `, values);

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

  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Produto com este nome já existe' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Delete product endpoint
app.delete('/api/products', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }

    // Check if product has stock movements
    const movementsCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM mascate_pro.stock_movements
      WHERE product_id = $1
    `, [id]);

    if (parseInt(movementsCheck.rows[0].count) > 0) {
      // If has movements, just deactivate
      await client.query(`
        UPDATE mascate_pro.products
        SET active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      return res.json({ message: 'Produto desativado (possui movimentações)' });
    } else {
      // If no movements, delete permanently
      const result = await client.query(`
        DELETE FROM mascate_pro.products
        WHERE id = $1
        RETURNING name
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      return res.json({ message: `Produto ${result.rows[0].name} excluído com sucesso` });
    }

  } catch (error) {
    console.error('Delete product error:', error);
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
             u.display_name as user_name
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
             u.display_name as user_name
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

// Create activity log endpoint
app.post('/api/activity-logs', async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, action, details, ip_address, user_agent } = req.body;

    // Validate required fields
    if (!user_id || !action) {
      return res.status(400).json({ error: 'user_id e action são obrigatórios' });
    }

    const result = await client.query(`
      INSERT INTO mascate_pro.activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, action, details, ip_address, user_agent, created_at
    `, [user_id, action, details || {}, ip_address || req.ip, user_agent || req.get('User-Agent')]);

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create activity log error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  console.log('GET /api/categories request received');

  let client;
  try {
    client = await pool.connect();
    console.log('Database connection successful for categories endpoint');
  } catch (dbError) {
    console.error('Database connection error for categories endpoint:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const result = await client.query(`
      SELECT id, name, description, icon, color, active, created_at, updated_at
      FROM mascate_pro.categories
      WHERE active = true
      ORDER BY name ASC
    `);

    return res.json(result.rows);

  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Get single category endpoint
app.get('/api/categories/:id', async (req, res) => {
  console.log('GET /api/categories/:id request received:', req.params.id);

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for get category by id:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { id } = req.params;

    const result = await client.query(`
      SELECT id, name, description, icon, color, active, created_at, updated_at, created_by
      FROM mascate_pro.categories
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error('Get category by id error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

app.post('/api/categories', async (req, res) => {
  console.log('POST /api/categories request received:', req.body);

  let client;
  try {
    client = await pool.connect();
    console.log('Database connection successful for create category');
  } catch (dbError) {
    console.error('Database connection error for create category:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { name, description, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    // Get any superadmin user ID for created_by
    console.log('🔍 Buscando usuário superadmin...');
    const superadminResult = await client.query(
      "SELECT id, email, display_name, role, active FROM mascate_pro.users WHERE role = 'superadmin' AND active = true LIMIT 1"
    );

    console.log('📊 Resultado da busca superadmin:', {
      rowCount: superadminResult.rows.length,
      users: superadminResult.rows
    });

    if (superadminResult.rows.length === 0) {
      // Debug: vamos verificar todos os usuários
      const allUsersResult = await client.query("SELECT id, email, role, active FROM mascate_pro.users ORDER BY role");
      console.log('🔍 Todos os usuários no banco:', allUsersResult.rows);

      return res.status(500).json({ error: 'Nenhum usuário superadmin ativo encontrado' });
    }

    const createdById = superadminResult.rows[0].id;
    console.log('✅ Usando usuário para created_by:', superadminResult.rows[0].email);

    const result = await client.query(`
      INSERT INTO mascate_pro.categories (name, description, icon, color, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, icon, color, active, created_at, updated_at
    `, [name, description || null, icon || null, color || null, createdById]);

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Uma categoria com este nome já existe' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

app.put('/api/categories/:id', async (req, res) => {
  console.log('PUT /api/categories/:id request received:', req.params.id, req.body);

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for update category:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { id } = req.params;
    const { name, description, icon, color, active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const result = await client.query(`
      UPDATE mascate_pro.categories
      SET name = $1, description = $2, icon = $3, color = $4, active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, description, icon, color, active, created_at, updated_at
    `, [name, description || null, icon || null, color || null, active !== false, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Uma categoria com este nome já existe' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  console.log('DELETE /api/categories/:id request received:', req.params.id);

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for delete category:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { id } = req.params;

    // Check if category is being used by any products
    const productsCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM mascate_pro.products p
      JOIN mascate_pro.categories c ON p.category = c.name
      WHERE c.id = $1 AND p.active = true
    `, [id]);

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Não é possível excluir uma categoria que está sendo usada por produtos'
      });
    }

    const result = await client.query(`
      DELETE FROM mascate_pro.categories
      WHERE id = $1
      RETURNING id, name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    return res.json({ message: `Categoria '${result.rows[0].name}' excluída com sucesso` });

  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// System endpoints
app.get('/api/system/info', async (req, res) => {
  console.log('GET /api/system/info request received');

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for system info:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    // Get database size
    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as db_size,
             pg_database_size(current_database()) as db_size_bytes
    `);

    // Get PostgreSQL version
    const versionResult = await client.query('SELECT version()');

    // Get table counts
    const tableCountsResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM mascate_pro.users) as users_count,
        (SELECT COUNT(*) FROM mascate_pro.categories) as categories_count,
        (SELECT COUNT(*) FROM mascate_pro.products) as products_count,
        (SELECT COUNT(*) FROM mascate_pro.stock_movements) as movements_count,
        (SELECT COUNT(*) FROM mascate_pro.activity_logs) as logs_count
    `);

    const systemInfo = {
      version: process.env.npm_package_version || '1.0.0',
      database: {
        type: 'PostgreSQL',
        version: versionResult.rows[0].version.split(' ')[1],
        size: sizeResult.rows[0].db_size,
        sizeBytes: parseInt(sizeResult.rows[0].db_size_bytes)
      },
      tables: tableCountsResult.rows[0],
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      lastUpdate: new Date().toISOString()
    };

    return res.json(systemInfo);

  } catch (error) {
    console.error('Get system info error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

app.post('/api/system/backup', async (req, res) => {
  console.log('POST /api/system/backup request received');

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for backup:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    // Get all data from all tables
    const users = await client.query('SELECT * FROM mascate_pro.users');
    const categories = await client.query('SELECT * FROM mascate_pro.categories');
    const products = await client.query('SELECT * FROM mascate_pro.products');
    const stockMovements = await client.query('SELECT * FROM mascate_pro.stock_movements');
    const activityLogs = await client.query('SELECT * FROM mascate_pro.activity_logs ORDER BY created_at DESC LIMIT 1000'); // Last 1000 logs

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'PostgreSQL',
      tables: {
        users: users.rows,
        categories: categories.rows,
        products: products.rows,
        stock_movements: stockMovements.rows,
        activity_logs: activityLogs.rows
      },
      metadata: {
        total_records: users.rows.length + categories.rows.length + products.rows.length + stockMovements.rows.length + activityLogs.rows.length,
        backup_size: JSON.stringify({
          users: users.rows,
          categories: categories.rows,
          products: products.rows,
          stock_movements: stockMovements.rows,
          activity_logs: activityLogs.rows
        }).length
      }
    };

    // Set headers for file download
    const filename = `mascate-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.json(backupData);

  } catch (error) {
    console.error('Create backup error:', error);
    return res.status(500).json({ error: 'Erro ao criar backup' });
  } finally {
    client.release();
  }
});

app.delete('/api/system/cleanup/:type', async (req, res) => {
  console.log('DELETE /api/system/cleanup request received:', req.params.type);

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for cleanup:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { type } = req.params;
    let deletedCount = 0;

    switch (type) {
      case 'logs':
        // Delete logs older than 30 days
        const logsResult = await client.query(`
          DELETE FROM mascate_pro.activity_logs
          WHERE created_at < NOW() - INTERVAL '30 days'
          RETURNING id
        `);
        deletedCount = logsResult.rowCount;
        break;

      case 'movements':
        // Delete stock movements older than 1 year
        const movementsResult = await client.query(`
          DELETE FROM mascate_pro.stock_movements
          WHERE created_at < NOW() - INTERVAL '1 year'
          RETURNING id
        `);
        deletedCount = movementsResult.rowCount;
        break;

      default:
        return res.status(400).json({ error: 'Tipo de limpeza inválido' });
    }

    return res.json({
      message: `Limpeza concluída: ${deletedCount} registros removidos`,
      type,
      deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ error: 'Erro ao executar limpeza' });
  } finally {
    client.release();
  }
});

app.post('/api/system/export/:format', async (req, res) => {
  console.log('POST /api/system/export request received:', req.params.format);

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for export:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { format } = req.params;

    // Get export data
    const productsResult = await client.query(`
      SELECT
        p.name,
        p.category,
        p.unit,
        p.packaging,
        p.purchase_price,
        p.sale_price,
        p.current_stock,
        p.minimum_stock,
        p.created_at
      FROM mascate_pro.products p
      WHERE p.active = true
      ORDER BY p.name
    `);

    const movementsResult = await client.query(`
      SELECT
        sm.created_at,
        p.name as product_name,
        sm.type,
        sm.quantity,
        sm.price_per_unit,
        sm.total_value,
        sm.notes,
        u.display_name as user_name
      FROM mascate_pro.stock_movements sm
      JOIN mascate_pro.products p ON sm.product_id = p.id
      JOIN mascate_pro.users u ON sm.user_id = u.id
      ORDER BY sm.created_at DESC
      LIMIT 1000
    `);

    const exportData = {
      products: productsResult.rows,
      movements: movementsResult.rows,
      exported_at: new Date().toISOString(),
      total_products: productsResult.rows.length,
      total_movements: movementsResult.rows.length
    };

    let filename, contentType, fileContent;

    switch (format) {
      case 'csv':
        // Generate CSV content
        const csvProducts = [
          'Nome,Categoria,Unidade,Embalagem,Preço Compra,Preço Venda,Estoque Atual,Estoque Mínimo,Data Criação',
          ...exportData.products.map(p =>
            `"${p.name}","${p.category}","${p.unit}","${p.packaging}",${p.purchase_price},${p.sale_price},${p.current_stock},${p.minimum_stock},"${new Date(p.created_at).toLocaleDateString('pt-BR')}"`
          )
        ].join('\n');

        const csvMovements = [
          'Data,Produto,Tipo,Quantidade,Preço Unitário,Valor Total,Observações,Usuário',
          ...exportData.movements.map(m =>
            `"${new Date(m.created_at).toLocaleDateString('pt-BR')}","${m.product_name}","${m.type}",${m.quantity},${m.price_per_unit || 0},${m.total_value || 0},"${m.notes || ''}","${m.user_name}"`
          )
        ].join('\n');

        fileContent = `PRODUTOS\n${csvProducts}\n\n\nMOVIMENTAÇÕES\n${csvMovements}`;
        filename = `mascate-export-${new Date().toISOString().split('T')[0]}.csv`;
        contentType = 'text/csv; charset=utf-8';
        break;

      case 'json':
        fileContent = JSON.stringify(exportData, null, 2);
        filename = `mascate-export-${new Date().toISOString().split('T')[0]}.json`;
        contentType = 'application/json';
        break;

      default:
        return res.status(400).json({ error: 'Formato de exportação não suportado. Use: csv, json' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));

    return res.send(fileContent);

  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Erro ao exportar dados' });
  } finally {
    client.release();
  }
});

// Configuration endpoints
app.get('/api/config/:key', async (req, res) => {
  console.log('GET /api/config request received:', req.params.key);

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for config:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { key } = req.params;

    const result = await client.query(`
      SELECT value, description, updated_at
      FROM mascate_pro.configurations
      WHERE key = $1 AND active = true
    `, [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    return res.json({
      key,
      value: result.rows[0].value,
      description: result.rows[0].description,
      updated_at: result.rows[0].updated_at
    });

  } catch (error) {
    console.error('Get config error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

app.post('/api/config/:key', async (req, res) => {
  console.log('POST /api/config request received:', req.params.key, req.body);

  let client;
  try {
    client = await pool.connect();
  } catch (dbError) {
    console.error('Database connection error for save config:', dbError);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados'
    });
  }

  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Valor da configuração é obrigatório' });
    }

    // Get any superadmin user ID for created_by
    const superadminResult = await client.query(
      "SELECT id FROM mascate_pro.users WHERE role = 'superadmin' AND active = true LIMIT 1"
    );

    if (superadminResult.rows.length === 0) {
      return res.status(500).json({ error: 'Nenhum usuário superadmin ativo encontrado' });
    }

    const createdById = superadminResult.rows[0].id;

    // Upsert configuration
    const result = await client.query(`
      INSERT INTO mascate_pro.configurations (key, value, description, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, configurations.description),
        updated_at = CURRENT_TIMESTAMP
      RETURNING key, value, description, updated_at
    `, [key, JSON.stringify(value), description, createdById]);

    return res.json(result.rows[0]);

  } catch (error) {
    console.error('Save config error:', error);
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
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { pool } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = await pool.connect();

  try {
    switch (req.method) {
      case 'POST':
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
          req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
          req.headers['user-agent'] || 'unknown'
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

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    client.release();
  }
}
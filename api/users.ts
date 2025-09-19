import type { VercelRequest, VercelResponse } from '@vercel/node';
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
      case 'GET':
        if (req.query.id) {
          // Get user by ID
          const result = await client.query(`
            SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
                   role, active, created_at, updated_at
            FROM mascate_pro.users
            WHERE id = $1 AND active = true
          `, [req.query.id]);

          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          const user = {
            ...result.rows[0],
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at?.toISOString(),
          };

          return res.status(200).json(user);
        } else if (req.query.email) {
          // Get user by email
          const result = await client.query(`
            SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
                   role, active, created_at, updated_at
            FROM mascate_pro.users
            WHERE email = $1 AND active = true
          `, [req.query.email]);

          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          const user = {
            ...result.rows[0],
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at?.toISOString(),
          };

          return res.status(200).json(user);
        } else {
          // Get all users
          const result = await client.query(`
            SELECT id, username, email, display_name as "displayName", avatar_id as "avatarId",
                   role, active, created_at, updated_at
            FROM mascate_pro.users
            WHERE active = true
            ORDER BY created_at DESC
          `);

          const users = result.rows.map(row => ({
            ...row,
            created_at: row.created_at.toISOString(),
            updated_at: row.updated_at?.toISOString(),
          }));

          return res.status(200).json(users);
        }

      case 'POST':
        // Create user
        const { username, email, displayName, avatarId, role, active } = req.body;

        if (!username || !email || !displayName || !role) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const createResult = await client.query(`
          INSERT INTO mascate_pro.users (username, email, display_name, avatar_id, role, active)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, username, email, display_name as "displayName", avatar_id as "avatarId",
                    role, active, created_at, updated_at
        `, [username, email, displayName, avatarId, role, active !== undefined ? active : true]);

        const newUser = {
          ...createResult.rows[0],
          created_at: createResult.rows[0].created_at.toISOString(),
          updated_at: createResult.rows[0].updated_at?.toISOString(),
        };

        return res.status(201).json(newUser);

      case 'PUT':
        // Update user
        if (!req.query.id) {
          return res.status(400).json({ error: 'User ID required' });
        }

        const updates = req.body;
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.username !== undefined) {
          fields.push(`username = $${paramCount++}`);
          values.push(updates.username);
        }
        if (updates.email !== undefined) {
          fields.push(`email = $${paramCount++}`);
          values.push(updates.email);
        }
        if (updates.displayName !== undefined) {
          fields.push(`display_name = $${paramCount++}`);
          values.push(updates.displayName);
        }
        if (updates.avatarId !== undefined) {
          fields.push(`avatar_id = $${paramCount++}`);
          values.push(updates.avatarId);
        }
        if (updates.role !== undefined) {
          fields.push(`role = $${paramCount++}`);
          values.push(updates.role);
        }
        if (updates.active !== undefined) {
          fields.push(`active = $${paramCount++}`);
          values.push(updates.active);
        }

        fields.push(`updated_at = NOW()`);
        values.push(req.query.id);

        const updateResult = await client.query(`
          UPDATE mascate_pro.users
          SET ${fields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, username, email, display_name as "displayName", avatar_id as "avatarId",
                    role, active, created_at, updated_at
        `, values);

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = {
          ...updateResult.rows[0],
          created_at: updateResult.rows[0].created_at.toISOString(),
          updated_at: updateResult.rows[0].updated_at?.toISOString(),
        };

        return res.status(200).json(updatedUser);

      case 'DELETE':
        // Delete user (soft delete)
        if (!req.query.id) {
          return res.status(400).json({ error: 'User ID required' });
        }

        await client.query(`
          UPDATE mascate_pro.users
          SET active = false, updated_at = NOW()
          WHERE id = $1
        `, [req.query.id]);

        return res.status(200).json({ message: 'User deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}
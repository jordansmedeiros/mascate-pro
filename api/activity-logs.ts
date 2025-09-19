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
        // Get activity logs
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await client.query(`
          SELECT id, user_id, action, details, ip_address, user_agent, created_at
          FROM mascate_pro.activity_logs
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const logs = result.rows.map(row => ({
          ...row,
          created_at: row.created_at.toISOString(),
        }));

        return res.status(200).json(logs);

      case 'POST':
        // Create activity log
        const { user_id, action, details, ip_address, user_agent } = req.body;

        if (!user_id || !action) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const createResult = await client.query(`
          INSERT INTO mascate_pro.activity_logs (user_id, action, details, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, user_id, action, details, ip_address, user_agent, created_at
        `, [user_id, action, details, ip_address, user_agent]);

        const newLog = {
          ...createResult.rows[0],
          created_at: createResult.rows[0].created_at.toISOString(),
        };

        return res.status(201).json(newLog);

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
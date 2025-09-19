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
        // Get stock movements
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await client.query(`
          SELECT id, product_id, movement_type, quantity, previous_stock, new_stock,
                 unit_price, total_value, notes, created_at, created_by
          FROM mascate_pro.stock_movements
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const movements = result.rows.map(row => ({
          ...row,
          created_at: row.created_at.toISOString(),
        }));

        return res.status(200).json(movements);

      case 'POST':
        // Create stock movement
        const { product_id, movement_type, quantity, previous_stock, new_stock, unit_price, total_value, notes, created_by } = req.body;

        if (!product_id || !movement_type || quantity === undefined || previous_stock === undefined || new_stock === undefined || !created_by) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const createResult = await client.query(`
          INSERT INTO mascate_pro.stock_movements (product_id, movement_type, quantity, previous_stock,
                                                 new_stock, unit_price, total_value, notes, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, product_id, movement_type, quantity, previous_stock, new_stock,
                    unit_price, total_value, notes, created_at, created_by
        `, [product_id, movement_type, quantity, previous_stock, new_stock, unit_price, total_value, notes, created_by]);

        const newMovement = {
          ...createResult.rows[0],
          created_at: createResult.rows[0].created_at.toISOString(),
        };

        return res.status(201).json(newMovement);

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
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
          // Get product by ID
          const result = await client.query(`
            SELECT id, name, category, unit, packaging, purchase_price, sale_price,
                   current_stock, minimum_stock, active, created_at, updated_at, created_by
            FROM mascate_pro.products
            WHERE id = $1 AND active = true
          `, [req.query.id]);

          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }

          const product = {
            ...result.rows[0],
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at?.toISOString(),
          };

          return res.status(200).json(product);
        } else {
          // Get all products
          const result = await client.query(`
            SELECT id, name, category, unit, packaging, purchase_price, sale_price,
                   current_stock, minimum_stock, active, created_at, updated_at, created_by
            FROM mascate_pro.products
            WHERE active = true
            ORDER BY name ASC
          `);

          const products = result.rows.map(row => ({
            ...row,
            created_at: row.created_at.toISOString(),
            updated_at: row.updated_at?.toISOString(),
          }));

          return res.status(200).json(products);
        }

      case 'POST':
        // Create product
        const { name, category, unit, packaging, purchase_price, sale_price, current_stock, minimum_stock, active, created_by } = req.body;

        if (!name || !category || !unit || purchase_price === undefined || sale_price === undefined || !created_by) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const createResult = await client.query(`
          INSERT INTO mascate_pro.products (name, category, unit, packaging, purchase_price, sale_price,
                                          current_stock, minimum_stock, active, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, name, category, unit, packaging, purchase_price, sale_price,
                    current_stock, minimum_stock, active, created_at, updated_at, created_by
        `, [name, category, unit, packaging, purchase_price, sale_price,
            current_stock || 0, minimum_stock || 0, active !== undefined ? active : true, created_by]);

        const newProduct = {
          ...createResult.rows[0],
          created_at: createResult.rows[0].created_at.toISOString(),
          updated_at: createResult.rows[0].updated_at?.toISOString(),
        };

        return res.status(201).json(newProduct);

      case 'PUT':
        // Update product
        if (!req.query.id) {
          return res.status(400).json({ error: 'Product ID required' });
        }

        const updates = req.body;
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.name !== undefined) {
          fields.push(`name = $${paramCount++}`);
          values.push(updates.name);
        }
        if (updates.category !== undefined) {
          fields.push(`category = $${paramCount++}`);
          values.push(updates.category);
        }
        if (updates.unit !== undefined) {
          fields.push(`unit = $${paramCount++}`);
          values.push(updates.unit);
        }
        if (updates.packaging !== undefined) {
          fields.push(`packaging = $${paramCount++}`);
          values.push(updates.packaging);
        }
        if (updates.purchase_price !== undefined) {
          fields.push(`purchase_price = $${paramCount++}`);
          values.push(updates.purchase_price);
        }
        if (updates.sale_price !== undefined) {
          fields.push(`sale_price = $${paramCount++}`);
          values.push(updates.sale_price);
        }
        if (updates.current_stock !== undefined) {
          fields.push(`current_stock = $${paramCount++}`);
          values.push(updates.current_stock);
        }
        if (updates.minimum_stock !== undefined) {
          fields.push(`minimum_stock = $${paramCount++}`);
          values.push(updates.minimum_stock);
        }
        if (updates.active !== undefined) {
          fields.push(`active = $${paramCount++}`);
          values.push(updates.active);
        }

        fields.push(`updated_at = NOW()`);
        values.push(req.query.id);

        const updateResult = await client.query(`
          UPDATE mascate_pro.products
          SET ${fields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, name, category, unit, packaging, purchase_price, sale_price,
                    current_stock, minimum_stock, active, created_at, updated_at, created_by
        `, values);

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = {
          ...updateResult.rows[0],
          created_at: updateResult.rows[0].created_at.toISOString(),
          updated_at: updateResult.rows[0].updated_at?.toISOString(),
        };

        return res.status(200).json(updatedProduct);

      case 'DELETE':
        // Delete product (soft delete)
        if (!req.query.id) {
          return res.status(400).json({ error: 'Product ID required' });
        }

        await client.query(`
          UPDATE mascate_pro.products
          SET active = false, updated_at = NOW()
          WHERE id = $1
        `, [req.query.id]);

        return res.status(200).json({ message: 'Product deleted successfully' });

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
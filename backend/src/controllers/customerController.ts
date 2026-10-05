import { Request, Response } from 'express';
import { db } from '../config/database.js';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, tier, platform } = req.query;

    let query = `
      SELECT 
        c.id,
        c.name,
        c.phone_number,
        c.loyalty_tier,
        c.purchase_history_count,
        c.lifetime_value,
        c.preferred_platform,
        c.created_at,
        COALESCE(
          ARRAY_AGG(ct.tag) FILTER (WHERE ct.tag IS NOT NULL), 
          '{}'
        ) AS tags
      FROM customers c
      LEFT JOIN customer_tags ct ON c.id = ct.customer_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.phone_number ILIKE $${params.length})`;
    }

    if (tier) {
      params.push(tier);
      query += ` AND c.loyalty_tier = $${params.length}`;
    }

    if (platform) {
      params.push(platform);
      query += ` AND c.preferred_platform = $${params.length}`;
    }

    query += ` GROUP BY c.id ORDER BY c.lifetime_value DESC, c.name ASC`;

    const result = await db.query(query, params);

    const customers = result.rows.map(row => ({
      ...row,
      lifetime_value: Number(row.lifetime_value),
      purchase_history_count: Number(row.purchase_history_count)
    }));

    res.json({
      status: 'success',
      total: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data pelanggan' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Fetch customer details
    const custResult = await db.query(
      `SELECT 
        c.id,
        c.name,
        c.phone_number,
        c.loyalty_tier,
        c.purchase_history_count,
        c.lifetime_value,
        c.preferred_platform,
        c.created_at,
        COALESCE(ARRAY_AGG(ct.tag) FILTER (WHERE ct.tag IS NOT NULL), '{}') AS tags
      FROM customers c
      LEFT JOIN customer_tags ct ON c.id = ct.customer_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [id]
    );

    if (custResult.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Pelanggan tidak ditemukan' });
      return;
    }

    const customer = {
      ...custResult.rows[0],
      lifetime_value: Number(custResult.rows[0].lifetime_value),
      purchase_history_count: Number(custResult.rows[0].purchase_history_count)
    };

    // 2. Fetch customer orders with items
    const ordersResult = await db.query(
      `SELECT 
        o.id AS order_id,
        o.platform,
        o.external_order_id,
        o.total,
        o.status,
        o.created_at AS order_created_at,
        oi.id AS item_id,
        oi.qty,
        oi.price AS item_price,
        pv.sku,
        pv.color,
        pv.size,
        p.name AS product_name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC`,
      [id]
    );

    const ordersMap = new Map<number, any>();

    for (const row of ordersResult.rows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id: row.order_id,
          platform: row.platform,
          external_order_id: row.external_order_id,
          total: Number(row.total),
          status: row.status,
          created_at: row.order_created_at,
          items: []
        });
      }

      if (row.item_id) {
        ordersMap.get(row.order_id).items.push({
          id: row.item_id,
          product_name: row.product_name,
          sku: row.sku,
          color: row.color,
          size: row.size,
          qty: Number(row.qty),
          price: Number(row.item_price)
        });
      }
    }

    res.json({
      status: 'success',
      data: {
        ...customer,
        orders: Array.from(ordersMap.values())
      }
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil detail pelanggan' });
  }
};

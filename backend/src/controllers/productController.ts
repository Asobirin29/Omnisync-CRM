import { Request, Response } from 'express';
import { db } from '../config/database.js';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, low_stock_only } = req.query;

    let query = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.category AS product_category,
        p.created_at AS product_created_at,
        pv.id AS variant_id,
        pv.sku,
        pv.color,
        pv.size,
        pv.price,
        ic.id AS channel_id,
        ic.platform,
        ic.platform_item_id,
        ic.stock,
        ic.low_stock_threshold
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory_channels ic ON pv.id = ic.variant_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    query += ` ORDER BY p.id ASC, pv.id ASC, ic.platform ASC`;

    const result = await db.query(query, params);

    // Grouping into structured hierarchical JSON
    const productMap = new Map<number, any>();

    for (const row of result.rows) {
      if (!productMap.has(row.product_id)) {
        productMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          category: row.product_category,
          created_at: row.product_created_at,
          variants: new Map<number, any>()
        });
      }

      const prod = productMap.get(row.product_id);

      if (!prod.variants.has(row.variant_id)) {
        prod.variants.set(row.variant_id, {
          id: row.variant_id,
          sku: row.sku,
          color: row.color,
          size: row.size,
          price: Number(row.price),
          total_stock: 0,
          channels: []
        });
      }

      const variant = prod.variants.get(row.variant_id);

      if (row.channel_id) {
        const stockNum = Number(row.stock);
        variant.total_stock += stockNum;
        variant.channels.push({
          id: row.channel_id,
          platform: row.platform,
          platform_item_id: row.platform_item_id,
          stock: stockNum,
          low_stock_threshold: Number(row.low_stock_threshold),
          is_low_stock: stockNum <= Number(row.low_stock_threshold)
        });
      }
    }

    // Convert nested Maps to Arrays
    let products = Array.from(productMap.values()).map(p => ({
      ...p,
      variants: Array.from(p.variants.values())
    }));

    if (low_stock_only === 'true') {
      products = products.filter(p =>
        p.variants.some((v: any) =>
          v.channels.some((c: any) => c.is_low_stock)
        )
      );
    }

    res.json({
      status: 'success',
      total: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data produk' });
  }
};

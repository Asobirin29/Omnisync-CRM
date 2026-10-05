import { Request, Response } from 'express';
import { db, IQueryable } from '../config/database.js';
import {
  emitOrderCreated,
  emitStockUpdated,
  emitOrderUpdated,
  emitMessageNew,
  emitChatUpdated
} from '../services/socketService.js';
import { evaluateCustomerTags } from '../services/taggingService.js';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, status, search, limit = '100' } = req.query;

    let query = `
      SELECT 
        o.id,
        o.customer_id,
        c.name AS customer_name,
        c.phone_number AS customer_phone,
        o.platform,
        o.external_order_id,
        o.total,
        o.status,
        o.created_at,
        COUNT(oi.id) AS item_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'variant_id', oi.variant_id,
              'sku', pv.sku,
              'product_name', p.name,
              'color', pv.color,
              'size', pv.size,
              'qty', oi.qty,
              'price', oi.price
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (platform) {
      params.push(platform);
      query += ` AND o.platform = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.external_order_id ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    query += `
      GROUP BY o.id, c.name, c.phone_number
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1}
    `;
    params.push(Number(limit));

    const result = await db.query(query, params);

    const orders = result.rows.map(row => ({
      ...row,
      total: Number(row.total),
      item_count: Number(row.item_count)
    }));

    res.json({
      status: 'success',
      total: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data pesanan' });
  }
};

export const createManualOrder = async (req: Request, res: Response): Promise<void> => {
  const { customer_id, items, status = 'paid' } = req.body;

  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'Format pesanan tidak lengkap: customer_id dan items wajib diisi'
    });
    return;
  }

  try {
    const orderData = await db.transaction(async (tx: IQueryable) => {
      // 1. Validate customer existence
      const custRes = await tx.query(`SELECT id, name, phone_number FROM customers WHERE id = $1`, [customer_id]);
      if (custRes.rows.length === 0) {
        throw new Error(`Pelanggan ID ${customer_id} tidak ditemukan`);
      }
      const customer = custRes.rows[0];

      // 2. Validate items and verify multi-channel stock availability
      const validatedItems: any[] = [];
      let calculatedTotal = 0;

      for (const item of items) {
        const qty = Number(item.qty);
        if (!qty || qty <= 0) {
          throw new Error('Kuantitas pesanan (qty) harus lebih besar dari 0');
        }

        let variantQuery = `
          SELECT pv.id, pv.sku, pv.price, pv.color, pv.size, p.name AS product_name
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          WHERE `;
        const variantParams: any[] = [];

        if (item.variant_id) {
          variantQuery += `pv.id = $1`;
          variantParams.push(item.variant_id);
        } else if (item.sku) {
          variantQuery += `pv.sku = $1`;
          variantParams.push(item.sku);
        } else {
          throw new Error('Setiap item harus menyertakan variant_id atau sku');
        }

        const vRes = await tx.query(variantQuery, variantParams);
        if (vRes.rows.length === 0) {
          throw new Error(`Varian produk tidak ditemukan`);
        }
        const variant = vRes.rows[0];

        // Check stock in ALL channels
        const chRes = await tx.query(
          `SELECT platform, stock, low_stock_threshold FROM inventory_channels WHERE variant_id = $1`,
          [variant.id]
        );

        for (const ch of chRes.rows) {
          if (ch.stock < qty) {
            const err: any = new Error(
              `Stok tidak mencukupi untuk SKU '${variant.sku}' pada channel '${ch.platform}'. Tersisa: ${ch.stock}, dibutuhkan: ${qty}`
            );
            err.code = 'INSUFFICIENT_STOCK';
            throw err;
          }
        }

        const itemTotal = Number(variant.price) * qty;
        calculatedTotal += itemTotal;

        validatedItems.push({
          variant_id: variant.id,
          sku: variant.sku,
          product_name: variant.product_name,
          color: variant.color,
          size: variant.size,
          price: Number(variant.price),
          qty
        });
      }

      // 3. Generate unique external_order_id for WhatsApp
      const extOrderId = `WA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Insert order record
      const orderInsert = await tx.query(
        `INSERT INTO orders (customer_id, platform, external_order_id, total, status, created_at)
         VALUES ($1, 'whatsapp', $2, $3, $4, NOW())
         RETURNING id, created_at`,
        [customer_id, extOrderId, calculatedTotal, status]
      );
      const orderId = orderInsert.rows[0].id;
      const createdAt = orderInsert.rows[0].created_at;

      // 5. Insert order_items and DEDUCT stock across ALL platform channels
      const affectedVariantIds = new Set<number>();
      const insertedItems: any[] = [];

      for (const it of validatedItems) {
        const oiRes = await tx.query(
          `INSERT INTO order_items (order_id, variant_id, qty, price)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [orderId, it.variant_id, it.qty, it.price]
        );

        // Deduct stock in ALL platform channels
        await tx.query(
          `UPDATE inventory_channels
           SET stock = stock - $1, updated_at = NOW()
           WHERE variant_id = $2`,
          [it.qty, it.variant_id]
        );

        affectedVariantIds.add(it.variant_id);

        insertedItems.push({
          id: oiRes.rows[0].id,
          ...it
        });
      }

      // 6. Update customer stats & re-evaluate tags inside the same transaction
      const customerTagsUpdate = await evaluateCustomerTags(customer_id, tx);

      // 7. Auto-send confirmation message into customer's chat session
      const itemsListText = validatedItems
        .map(i => `• ${i.product_name} (${i.color} - ${i.size}) x${i.qty}`)
        .join('\n');

      const confirmationBody = `✅ PESANAN MANUAL WHATSAPP BERHASIL DIBUAT
No. Pesanan: #${extOrderId}
Status: ${status.toUpperCase()}
Item:
${itemsListText}
Total Pembayaran: Rp ${new Intl.NumberFormat('id-ID').format(calculatedTotal)}

Pesanan Kak ${customer.name} langsung masuk antrean gudang Rancaekek Supply Co. Terima kasih! 🌲`;

      // Find or create whatsapp chat session for this customer
      let sessionId: number;
      const sessionRes = await tx.query(
        `SELECT id FROM chat_sessions WHERE customer_id = $1 AND platform = 'whatsapp' ORDER BY last_message_at DESC LIMIT 1`,
        [customer_id]
      );

      if (sessionRes.rows.length > 0) {
        sessionId = sessionRes.rows[0].id;
        await tx.query(
          `UPDATE chat_sessions SET last_message = $1, last_message_at = NOW(), unread_count = 0 WHERE id = $2`,
          [confirmationBody, sessionId]
        );
      } else {
        const newSessionRes = await tx.query(
          `INSERT INTO chat_sessions (customer_id, platform, last_message, last_message_at, unread_count, status, urgency)
           VALUES ($1, 'whatsapp', $2, NOW(), 0, 'open', 'medium') RETURNING id`,
          [customer_id, confirmationBody]
        );
        sessionId = newSessionRes.rows[0].id;
      }

      // Insert confirmation message
      const msgRes = await tx.query(
        `INSERT INTO chat_messages (session_id, sender, body, created_at)
         VALUES ($1, 'cs', $2, NOW()) RETURNING *`,
        [sessionId, confirmationBody]
      );

      // Fetch updated stock for all affected variants to emit
      const updatedVariantsStock: any[] = [];
      for (const vId of affectedVariantIds) {
        const vInfoRes = await tx.query(`SELECT pv.sku, p.name FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = $1`, [vId]);
        const chRes = await tx.query(`SELECT platform, stock, low_stock_threshold FROM inventory_channels WHERE variant_id = $1`, [vId]);
        const channels = chRes.rows.map(ch => ({
          platform: ch.platform,
          stock: Number(ch.stock),
          low_stock_threshold: Number(ch.low_stock_threshold),
          is_low_stock: Number(ch.stock) <= Number(ch.low_stock_threshold)
        }));
        updatedVariantsStock.push({
          variant_id: vId,
          sku: vInfoRes.rows[0].sku,
          product_name: vInfoRes.rows[0].name,
          channels,
          total_stock: channels.reduce((s, c) => s + c.stock, 0)
        });
      }

      return {
        order: {
          id: orderId,
          customer_id,
          customer_name: customer.name,
          customer_phone: customer.phone_number,
          platform: 'whatsapp',
          external_order_id: extOrderId,
          total: calculatedTotal,
          status,
          created_at: createdAt,
          items: insertedItems
        },
        customerTagsUpdate,
        confirmationMessage: msgRes.rows[0],
        sessionId,
        updatedVariantsStock
      };
    });

    // 8. Outside transaction: Emit Real-time Events
    emitOrderCreated(orderData.order);

    for (const vStock of orderData.updatedVariantsStock) {
      emitStockUpdated(vStock);
    }

    emitMessageNew({
      ...orderData.confirmationMessage,
      platform: 'whatsapp'
    });

    const sessionRes = await db.query(
      `SELECT cs.*, c.name AS customer_name, c.phone_number AS customer_phone, c.loyalty_tier
       FROM chat_sessions cs
       JOIN customers c ON cs.customer_id = c.id
       WHERE cs.id = $1`,
      [orderData.sessionId]
    );
    if (sessionRes.rows.length > 0) {
      emitChatUpdated(sessionRes.rows[0]);
    }

    res.status(201).json({
      status: 'success',
      message: 'Pesanan manual WhatsApp berhasil dibuat dan dikonfirmasi',
      data: orderData.order
    });
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_STOCK') {
      res.status(409).json({
        status: 'error',
        code: 'INSUFFICIENT_STOCK',
        message: error.message
      });
      return;
    }
    console.error('[Create Manual Order Error]:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal membuat pesanan manual'
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending_payment', 'paid', 'shipped', 'completed', 'returned', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      status: 'error',
      message: `Status '${status}' tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`
    });
    return;
  }

  try {
    const updateRes = await db.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan' });
      return;
    }

    const updatedOrder = updateRes.rows[0];

    // Re-evaluate customer tags and metrics
    const customerTagsUpdate = await evaluateCustomerTags(updatedOrder.customer_id);

    emitOrderUpdated({
      ...updatedOrder,
      total: Number(updatedOrder.total)
    });

    res.json({
      status: 'success',
      message: `Status pesanan #${updatedOrder.external_order_id} berhasil diubah ke ${status}`,
      data: {
        order: {
          ...updatedOrder,
          total: Number(updatedOrder.total)
        },
        customer: customerTagsUpdate
      }
    });
  } catch (error: any) {
    console.error('[Update Order Status Error]:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal mengubah status pesanan'
    });
  }
};

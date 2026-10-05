import { Request, Response } from 'express';
import { db, IQueryable } from '../config/database.js';
import { emitOrderCreated, emitStockUpdated, emitMessageNew, emitChatUpdated } from '../services/socketService.js';
import { evaluateCustomerTags } from '../services/taggingService.js';

class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

const ALLOWED_PLATFORMS = ['shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp'];

export const handleOrderWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = performance.now();
  const platform = req.params.platform as string;
  const { external_order_id, customer, items, status = 'paid' } = req.body;

  // 1. Parameter Validation
  if (!ALLOWED_PLATFORMS.includes(platform)) {
    res.status(400).json({
      status: 'error',
      message: `Platform '${platform}' tidak valid. Harus salah satu dari: ${ALLOWED_PLATFORMS.join(', ')}`
    });
    return;
  }

  if (!external_order_id || !customer || !customer.phone || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'Format payload tidak lengkap. Diperlukan: external_order_id, customer.phone, customer.name, dan items array'
    });
    return;
  }

  try {
    // 2. Idempotency Check
    const existingOrderRes = await db.query(
      `SELECT o.id, o.customer_id, o.platform, o.external_order_id, o.total, o.status, o.created_at,
              c.name AS customer_name, c.phone_number AS customer_phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.platform = $1 AND o.external_order_id = $2`,
      [platform, external_order_id]
    );

    if (existingOrderRes.rows.length > 0) {
      const existingOrder = existingOrderRes.rows[0];

      // Fetch items for the existing order
      const existingItemsRes = await db.query(
        `SELECT oi.id, oi.variant_id, oi.qty, oi.price, pv.sku, p.name AS product_name, pv.color, pv.size
         FROM order_items oi
         JOIN product_variants pv ON oi.variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         WHERE oi.order_id = $1`,
        [existingOrder.id]
      );

      const sync_latency_ms = Math.round(performance.now() - startTime);

      res.status(200).json({
        status: 'success',
        message: 'Pesanan sudah ada (idempoten: tidak ada pemotongan stok ulang)',
        idempotent: true,
        sync_latency_ms,
        data: {
          ...existingOrder,
          total: Number(existingOrder.total),
          items: existingItemsRes.rows
        }
      });
      return;
    }

    // 3. Process new order inside a SINGLE ACID TRANSACTION
    const orderResult = await db.transaction(async (tx: IQueryable) => {
      // Step 3a: Verify all SKUs and check stock availability across ALL platforms
      const validatedItems: {
        variant_id: number;
        sku: string;
        price: number;
        qty: number;
        product_name: string;
        color: string;
        size: string;
      }[] = [];

      for (const item of items) {
        if (!item.sku || !item.qty || item.qty <= 0) {
          throw new Error(`Data item tidak valid: sku dan qty (> 0) wajib diisi`);
        }

        // Fetch variant details
        const variantRes = await tx.query(
          `SELECT pv.id, pv.sku, pv.price, pv.color, pv.size, p.name AS product_name
           FROM product_variants pv
           JOIN products p ON pv.product_id = p.id
           WHERE pv.sku = $1`,
          [item.sku]
        );

        if (variantRes.rows.length === 0) {
          throw new Error(`SKU '${item.sku}' tidak ditemukan di katalog produk`);
        }

        const v = variantRes.rows[0];

        // Check stock on ALL channels for this variant
        const channelsRes = await tx.query(
          `SELECT id, platform, stock, low_stock_threshold
           FROM inventory_channels
           WHERE variant_id = $1`,
          [v.id]
        );

        for (const ch of channelsRes.rows) {
          if (ch.stock < item.qty) {
            throw new InsufficientStockError(
              `Stok tidak mencukupi untuk SKU '${v.sku}' pada platform '${ch.platform}'. Stok saat ini: ${ch.stock}, dibutuhkan: ${item.qty}`
            );
          }
        }

        validatedItems.push({
          variant_id: v.id,
          sku: v.sku,
          price: Number(v.price),
          qty: Number(item.qty),
          product_name: v.product_name,
          color: v.color,
          size: v.size
        });
      }

      // Step 3b: Find or create customer by phone number
      const phoneClean = customer.phone.trim();
      let customerId: number;

      const custRes = await tx.query(
        `SELECT id, name, purchase_history_count, lifetime_value FROM customers WHERE phone_number = $1`,
        [phoneClean]
      );

      if (custRes.rows.length > 0) {
        customerId = custRes.rows[0].id;
      } else {
        const newCustRes = await tx.query(
          `INSERT INTO customers (name, phone_number, loyalty_tier, preferred_platform)
           VALUES ($1, $2, 'Bronze', $3) RETURNING id`,
          [customer.name || 'Pelanggan Baru', phoneClean, platform]
        );
        customerId = newCustRes.rows[0].id;

        await tx.query(
          `INSERT INTO customer_tags (customer_id, tag) VALUES ($1, 'Customer Baru')`,
          [customerId]
        );
      }

      // Step 3c: Calculate total price
      const orderTotal = validatedItems.reduce((acc, it) => acc + it.price * it.qty, 0);

      // Step 3d: Insert order record
      const orderInsertRes = await tx.query(
        `INSERT INTO orders (customer_id, platform, external_order_id, total, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, created_at`,
        [customerId, platform, external_order_id, orderTotal, status]
      );
      const orderId = orderInsertRes.rows[0].id;
      const orderCreatedAt = orderInsertRes.rows[0].created_at;

      // Step 3e: Insert order items & DEDUCT STOCK ACROSS ALL PLATFORMS
      const insertedItems: any[] = [];
      const affectedVariantIds = new Set<number>();

      for (const it of validatedItems) {
        // Insert order_item
        const itemRes = await tx.query(
          `INSERT INTO order_items (order_id, variant_id, qty, price)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [orderId, it.variant_id, it.qty, it.price]
        );

        // Deduct stock in ALL platform channels for this variant
        await tx.query(
          `UPDATE inventory_channels
           SET stock = stock - $1, updated_at = NOW()
           WHERE variant_id = $2`,
          [it.qty, it.variant_id]
        );

        affectedVariantIds.add(it.variant_id);

        insertedItems.push({
          id: itemRes.rows[0].id,
          variant_id: it.variant_id,
          sku: it.sku,
          product_name: it.product_name,
          color: it.color,
          size: it.size,
          qty: it.qty,
          price: it.price
        });
      }

      // Step 3f: Update customer lifetime_value and purchase_history_count and evaluate tags
      if (['paid', 'shipped', 'completed'].includes(status)) {
        await tx.query(
          `UPDATE customers
           SET purchase_history_count = purchase_history_count + 1,
               lifetime_value = lifetime_value + $1
           WHERE id = $2`,
          [orderTotal, customerId]
        );
      }
      await evaluateCustomerTags(customerId, tx);

      // Step 3g: Fetch updated stock channels for all affected variants to emit via socket
      const updatedVariantsStock: any[] = [];
      for (const vId of affectedVariantIds) {
        const vInfoRes = await tx.query(
          `SELECT pv.id, pv.sku, p.name AS product_name
           FROM product_variants pv
           JOIN products p ON pv.product_id = p.id
           WHERE pv.id = $1`,
          [vId]
        );
        const vInfo = vInfoRes.rows[0];

        const chRes = await tx.query(
          `SELECT platform, stock, low_stock_threshold
           FROM inventory_channels
           WHERE variant_id = $1
           ORDER BY platform ASC`,
          [vId]
        );

        const channels = chRes.rows.map(ch => ({
          platform: ch.platform,
          stock: Number(ch.stock),
          low_stock_threshold: Number(ch.low_stock_threshold),
          is_low_stock: Number(ch.stock) <= Number(ch.low_stock_threshold)
        }));

        const totalStock = channels.reduce((sum, ch) => sum + ch.stock, 0);

        updatedVariantsStock.push({
          variant_id: vId,
          sku: vInfo.sku,
          product_name: vInfo.product_name,
          channels,
          total_stock: totalStock
        });
      }

      return {
        order: {
          id: orderId,
          customer_id: customerId,
          customer_name: customer.name,
          customer_phone: phoneClean,
          platform,
          external_order_id,
          total: orderTotal,
          status,
          created_at: orderCreatedAt,
          items: insertedItems
        },
        updatedVariantsStock
      };
    });

    const sync_latency_ms = Math.round(performance.now() - startTime);

    // 4. Emit Real-time Socket.io Events
    emitOrderCreated({
      ...orderResult.order,
      sync_latency_ms
    });

    for (const vStock of orderResult.updatedVariantsStock) {
      emitStockUpdated(vStock);
    }

    res.status(201).json({
      status: 'success',
      message: 'Order berhasil diproses dan stok tersinkronisasi ke seluruh platform',
      sync_latency_ms,
      data: orderResult.order
    });
  } catch (error: any) {
    const sync_latency_ms = Math.round(performance.now() - startTime);

    if (error instanceof InsufficientStockError || error.name === 'InsufficientStockError') {
      res.status(409).json({
        status: 'error',
        code: 'INSUFFICIENT_STOCK',
        message: error.message,
        sync_latency_ms
      });
      return;
    }

    console.error('[Order Webhook Error]:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Gagal memproses webhook order',
      sync_latency_ms
    });
  }
};

export const handleMessageWebhook = async (req: Request, res: Response): Promise<void> => {
  const platform = req.params.platform as string;
  const { customer, message, urgency = 'medium' } = req.body;

  if (!ALLOWED_PLATFORMS.includes(platform)) {
    res.status(400).json({
      status: 'error',
      message: `Platform '${platform}' tidak valid. Harus salah satu dari: ${ALLOWED_PLATFORMS.join(', ')}`
    });
    return;
  }

  if (!customer || !customer.phone || !message || typeof message !== 'string') {
    res.status(400).json({
      status: 'error',
      message: 'Format payload tidak lengkap. Diperlukan: customer.phone, customer.name, dan message string'
    });
    return;
  }

  try {
    const phoneClean = customer.phone.trim();
    let customerId: number;
    let customerName = customer.name || 'Pelanggan';

    // 1. Find or create customer
    const custRes = await db.query(
      `SELECT id, name, loyalty_tier FROM customers WHERE phone_number = $1`,
      [phoneClean]
    );

    if (custRes.rows.length > 0) {
      customerId = custRes.rows[0].id;
      customerName = custRes.rows[0].name;
    } else {
      const newCust = await db.query(
        `INSERT INTO customers (name, phone_number, loyalty_tier, preferred_platform)
         VALUES ($1, $2, 'Bronze', $3) RETURNING id`,
        [customerName, phoneClean, platform]
      );
      customerId = newCust.rows[0].id;

      await db.query(
        `INSERT INTO customer_tags (customer_id, tag) VALUES ($1, 'Lead Masuk')`,
        [customerId]
      );
    }

    // 2. Find or create chat session
    let sessionId: number;
    const sessionRes = await db.query(
      `SELECT id, unread_count, status
       FROM chat_sessions
       WHERE customer_id = $1 AND platform = $2
       ORDER BY last_message_at DESC
       LIMIT 1`,
      [customerId, platform]
    );

    if (sessionRes.rows.length > 0) {
      sessionId = sessionRes.rows[0].id;
      await db.query(
        `UPDATE chat_sessions
         SET last_message = $1,
             last_message_at = NOW(),
             unread_count = unread_count + 1,
             status = 'open',
             urgency = $2
         WHERE id = $3`,
        [message, urgency, sessionId]
      );
    } else {
      const newSession = await db.query(
        `INSERT INTO chat_sessions (customer_id, platform, last_message, last_message_at, unread_count, status, urgency)
         VALUES ($1, $2, $3, NOW(), 1, 'open', $4) RETURNING id`,
        [customerId, platform, message, urgency]
      );
      sessionId = newSession.rows[0].id;
    }

    // 3. Save incoming customer message
    const msgRes = await db.query(
      `INSERT INTO chat_messages (session_id, sender, body, created_at)
       VALUES ($1, 'customer', $2, NOW()) RETURNING *`,
      [sessionId, message]
    );
    const savedMessage = msgRes.rows[0];

    // 4. Fetch updated session with customer details
    const updatedSessionRes = await db.query(
      `SELECT cs.*, c.name AS customer_name, c.phone_number AS customer_phone, c.loyalty_tier
       FROM chat_sessions cs
       JOIN customers c ON cs.customer_id = c.id
       WHERE cs.id = $1`,
      [sessionId]
    );
    const updatedSession = updatedSessionRes.rows[0];

    // 5. Emit Real-time Socket.io events
    emitMessageNew({
      ...savedMessage,
      customer_name: customerName,
      platform
    });

    emitChatUpdated(updatedSession);

    res.status(201).json({
      status: 'success',
      message: 'Pesan masuk berhasil disimpan',
      data: {
        session: updatedSession,
        message: savedMessage
      }
    });
  } catch (error: any) {
    console.error('[Message Webhook Error]:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal memproses pesan masuk'
    });
  }
};

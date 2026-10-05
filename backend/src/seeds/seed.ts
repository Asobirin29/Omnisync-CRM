import { db } from '../config/database.js';
import { createSchema } from '../config/schema.js';
import { PRODUCTS_DATA, INDONESIAN_CUSTOMERS_DATA, CHAT_SCENARIOS } from './seedData.js';
import { evaluateCustomerTags } from '../services/taggingService.js';

export async function runSeeder(): Promise<void> {
  console.log('=== STARTING OMNISYNC DATABASE SEEDER ===');

  // Step 1: Re-create schema
  await createSchema();

  // Step 2: Seed Products & Variants
  console.log('[Seeder] Inserting Products & Variants...');
  const variantList: { id: number; sku: string; price: number; name: string }[] = [];

  for (const prod of PRODUCTS_DATA) {
    const resProd = await db.query(
      `INSERT INTO products (name, description, category) VALUES ($1, $2, $3) RETURNING id`,
      [prod.name, prod.description, prod.category]
    );
    const productId = resProd.rows[0].id;

    for (const v of prod.variants) {
      const resVar = await db.query(
        `INSERT INTO product_variants (product_id, sku, color, size, price) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [productId, v.sku, v.color, v.size, v.price]
      );
      const variantId = resVar.rows[0].id;
      variantList.push({ id: variantId, sku: v.sku, price: v.price, name: `${prod.name} (${v.color} - ${v.size})` });

      // Step 3: Insert 4 inventory_channels per variant
      const platforms = ['shopee', 'tokopedia', 'lazada', 'blibli'];
      for (const platform of platforms) {
        let stock = Math.floor(Math.random() * 25) + 10; // default 10-35
        if (v.initialStocks && v.initialStocks[platform] !== undefined) {
          stock = v.initialStocks[platform];
        }

        const platformItemId = `${platform.toUpperCase()}-${v.sku}-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.query(
          `INSERT INTO inventory_channels (variant_id, platform, platform_item_id, stock, low_stock_threshold)
           VALUES ($1, $2, $3, $4, $5)`,
          [variantId, platform, platformItemId, stock, 5]
        );
      }
    }
  }
  console.log(`[Seeder] Seeded ${PRODUCTS_DATA.length} products and ${variantList.length} variants across 4 channels.`);

  // Step 4: Seed Customers and Customer Tags
  console.log('[Seeder] Inserting 50 Indonesian Customers...');
  const customerIds: number[] = [];

  for (const c of INDONESIAN_CUSTOMERS_DATA) {
    const resCust = await db.query(
      `INSERT INTO customers (name, phone_number, loyalty_tier, preferred_platform)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [c.name, c.phone, c.tier, c.platform]
    );
    const custId = resCust.rows[0].id;
    customerIds.push(custId);

    for (const tag of c.tags) {
      await db.query(
        `INSERT INTO customer_tags (customer_id, tag) VALUES ($1, $2)`,
        [custId, tag]
      );
    }
  }

  // Step 5: Seed 30-day Orders History
  console.log('[Seeder] Generating 30-day Order History across all platforms...');
  const platforms = ['shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp'];
  const statuses = ['completed', 'completed', 'completed', 'shipped', 'paid', 'pending_payment', 'returned', 'cancelled'];
  const now = new Date();

  // Create around 65-75 orders
  let orderCount = 0;
  for (let i = 0; i < 70; i++) {
    const custId = customerIds[i % customerIds.length];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Days ago between 0 and 29 days
    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 3600000 * 12);
    const extId = `${platform.slice(0, 3).toUpperCase()}-${orderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${1000 + i}`;

    // Select 1 to 3 random items
    const numItems = Math.floor(Math.random() * 2) + 1;
    let orderTotal = 0;
    const selectedItems: { variant_id: number; qty: number; price: number }[] = [];

    for (let k = 0; k < numItems; k++) {
      const randomVariant = variantList[Math.floor(Math.random() * variantList.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      orderTotal += randomVariant.price * qty;
      selectedItems.push({
        variant_id: randomVariant.id,
        qty,
        price: randomVariant.price,
      });
    }

    const resOrder = await db.query(
      `INSERT INTO orders (customer_id, platform, external_order_id, total, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [custId, platform, extId, orderTotal, status, orderDate]
    );
    const orderId = resOrder.rows[0].id;

    for (const item of selectedItems) {
      await db.query(
        `INSERT INTO order_items (order_id, variant_id, qty, price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.variant_id, item.qty, item.price]
      );
    }
    orderCount++;
  }
  console.log(`[Seeder] Seeded ${orderCount} realistic orders.`);

  // Update customer purchase_history_count and lifetime_value based on created orders
  console.log('[Seeder] Calculating customer purchase stats...');
  await db.query(`
    UPDATE customers c
    SET 
      purchase_history_count = COALESCE(sub.cnt, 0),
      lifetime_value = COALESCE(sub.total_val, 0)
    FROM (
      SELECT customer_id, COUNT(*) as cnt, SUM(total) as total_val
      FROM orders
      WHERE status IN ('completed', 'shipped', 'paid')
      GROUP BY customer_id
    ) sub
    WHERE c.id = sub.customer_id;
  `);

  console.log('[Seeder] Evaluating automated rule-based customer tags...');
  for (const cid of customerIds) {
    await evaluateCustomerTags(cid);
  }

  // Step 6: Seed Chat Sessions & Messages
  console.log('[Seeder] Inserting 18 Chat Sessions and message logs...');
  for (let sIdx = 0; sIdx < CHAT_SCENARIOS.length; sIdx++) {
    const sc = CHAT_SCENARIOS[sIdx];
    const customerId = customerIds[sc.customerIndex];
    const lastMsg = sc.messages[sc.messages.length - 1];
    const unreadCount = sc.status === 'open' ? (lastMsg.sender === 'customer' ? 1 : 0) : 0;
    
    // Spread chat sessions over recent hours/days
    const hoursAgo = sIdx * 3;
    const sessionTime = new Date(now.getTime() - hoursAgo * 3600000);

    const resSession = await db.query(
      `INSERT INTO chat_sessions (customer_id, platform, last_message, last_message_at, unread_count, status, urgency)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [customerId, sc.platform, lastMsg.text, sessionTime, unreadCount, sc.status, sc.urgency]
    );
    const sessionId = resSession.rows[0].id;

    let msgTime = new Date(sessionTime.getTime() - sc.messages.length * 5 * 60000);
    for (const m of sc.messages) {
      msgTime = new Date(msgTime.getTime() + 4 * 60000);
      await db.query(
        `INSERT INTO chat_messages (session_id, sender, body, created_at, first_response_ms)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, m.sender, m.text, msgTime, m.responseMs]
      );
    }
  }
  console.log(`[Seeder] Seeded ${CHAT_SCENARIOS.length} realistic chat sessions with dialogue trees.`);

  console.log('=== DATABASE SEEDING COMPLETED SUCCESSFULLY! ===');
}

// Check if called directly from CLI
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  runSeeder()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seeder ERROR]:', err);
      await db.close();
      process.exit(1);
    });
}

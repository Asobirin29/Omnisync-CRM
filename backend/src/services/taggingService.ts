import { db, IQueryable } from '../config/database.js';
import { emitCustomerUpdated } from './socketService.js';

export const AUTOMATED_TAGS = ['VIP', 'Suka Retur', 'Pending Payment', 'New Customer'];

export async function evaluateCustomerTags(
  customerId: number,
  customQueryable?: IQueryable
): Promise<{ tags: string[]; lifetime_value: number; purchase_history_count: number; loyalty_tier: string }> {
  const q = customQueryable || db;

  // 1. Fetch customer stats and order counts
  const statsRes = await q.query(
    `SELECT 
      c.id,
      c.name,
      c.loyalty_tier,
      c.lifetime_value,
      c.purchase_history_count,
      COUNT(o.id) AS total_orders,
      COUNT(o.id) FILTER (WHERE o.status = 'returned') AS returned_count,
      COUNT(o.id) FILTER (WHERE o.status = 'pending_payment') AS pending_payment_count,
      COUNT(o.id) FILTER (WHERE o.status IN ('completed', 'shipped', 'paid')) AS paid_orders_count,
      COALESCE(SUM(o.total) FILTER (WHERE o.status IN ('completed', 'shipped', 'paid')), 0) AS calculated_ltv
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.id = $1
    GROUP BY c.id`,
    [customerId]
  );

  if (statsRes.rows.length === 0) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }

  const stat = statsRes.rows[0];
  const ltv = Number(stat.calculated_ltv);
  const totalOrders = Number(stat.total_orders);
  const returnedCount = Number(stat.returned_count);
  const pendingCount = Number(stat.pending_payment_count);
  const paidCount = Number(stat.paid_orders_count);

  // 2. Determine which automated tags apply
  const qualifyingTags: string[] = [];

  // Rule 1: "VIP" - lifetime_value >= Rp 3.000.000 ATAU jumlah order >= 5
  const isVip = ltv >= 3000000 || totalOrders >= 5;
  if (isVip) {
    qualifyingTags.push('VIP');
  }

  // Rule 2: "Suka Retur" - >= 2 order berstatus returned
  if (returnedCount >= 2) {
    qualifyingTags.push('Suka Retur');
  }

  // Rule 3: "Pending Payment" - ada order berstatus pending_payment
  if (pendingCount >= 1) {
    qualifyingTags.push('Pending Payment');
  }

  // Rule 4: "New Customer" - 0-1 order
  if (totalOrders <= 1) {
    qualifyingTags.push('New Customer');
  }

  // 3. Update customer table (sync calculated stats & tier)
  let newTier = stat.loyalty_tier;
  if (isVip) {
    newTier = 'Platinum';
  } else if (ltv >= 1500000 || totalOrders >= 3) {
    newTier = 'Gold';
  } else if (totalOrders >= 2) {
    newTier = 'Silver';
  }

  await q.query(
    `UPDATE customers
     SET lifetime_value = $1,
         purchase_history_count = $2,
         loyalty_tier = $3
     WHERE id = $4`,
    [ltv, paidCount, newTier, customerId]
  );

  // 4. Update customer_tags: remove existing automated tags and insert new ones
  await q.query(
    `DELETE FROM customer_tags
     WHERE customer_id = $1 AND tag = ANY($2::text[])`,
    [customerId, AUTOMATED_TAGS]
  );

  for (const tag of qualifyingTags) {
    await q.query(
      `INSERT INTO customer_tags (customer_id, tag)
       VALUES ($1, $2)
       ON CONFLICT (customer_id, tag) DO NOTHING`,
      [customerId, tag]
    );
  }

  // 5. Fetch all current tags for this customer
  const allTagsRes = await q.query(
    `SELECT tag FROM customer_tags WHERE customer_id = $1 ORDER BY id ASC`,
    [customerId]
  );
  const currentTags = allTagsRes.rows.map((r) => r.tag);

  const payload = {
    customer_id: customerId,
    tags: currentTags,
    lifetime_value: ltv,
    purchase_history_count: paidCount,
    loyalty_tier: newTier,
  };

  // 6. Emit real-time update
  emitCustomerUpdated(payload);

  return payload;
}

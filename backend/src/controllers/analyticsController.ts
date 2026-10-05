import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { runSeeder } from '../seeds/seed.js';
import { getIO } from '../services/socketService.js';

export const getDashboardAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Overall Summary Metrics
    const summaryRes = await db.query(`
      SELECT 
        COALESCE(SUM(total) FILTER (WHERE status IN ('paid', 'shipped', 'completed')), 0) AS total_revenue,
        COUNT(id) AS total_orders,
        COUNT(id) FILTER (WHERE status IN ('paid', 'shipped', 'completed')) AS successful_orders,
        COUNT(id) FILTER (WHERE status = 'pending_payment') AS pending_orders,
        COUNT(id) FILTER (WHERE status = 'returned') AS returned_orders
      FROM orders
    `);
    const summary = summaryRes.rows[0];

    // 2. Chat & CS Performance Metrics
    const chatStatsRes = await db.query(`
      SELECT 
        COUNT(id) AS total_sessions,
        COUNT(id) FILTER (WHERE status = 'open') AS open_sessions,
        COUNT(id) FILTER (WHERE status = 'resolved') AS resolved_sessions
      FROM chat_sessions
    `);
    const chatStats = chatStatsRes.rows[0];

    const csPerfRes = await db.query(`
      SELECT 
        COALESCE(AVG(first_response_ms) FILTER (WHERE first_response_ms IS NOT NULL), 0) AS avg_response_ms,
        COUNT(id) FILTER (WHERE sender = 'cs') AS total_cs_replies,
        COUNT(id) FILTER (WHERE sender = 'customer') AS total_customer_msgs
      FROM chat_messages
    `);
    const csPerf = csPerfRes.rows[0];

    // 3. Sales by Channel (Shopee, Tokopedia, Lazada, Blibli, WhatsApp)
    const channelSalesRes = await db.query(`
      SELECT 
        platform,
        COALESCE(SUM(total) FILTER (WHERE status IN ('paid', 'shipped', 'completed')), 0) AS revenue,
        COUNT(id) AS order_count
      FROM orders
      GROUP BY platform
      ORDER BY revenue DESC
    `);

    const allPlatforms = ['shopee', 'tokopedia', 'lazada', 'blibli', 'whatsapp'];
    const totalRevNum = Number(summary.total_revenue) || 1; // avoid divide by zero

    const channelMap = new Map<string, { revenue: number; order_count: number }>();
    for (const r of channelSalesRes.rows) {
      channelMap.set(r.platform, {
        revenue: Number(r.revenue),
        order_count: Number(r.order_count),
      });
    }

    const channelSales = allPlatforms.map((p) => {
      const entry = channelMap.get(p) || { revenue: 0, order_count: 0 };
      const pct = Math.round((entry.revenue / totalRevNum) * 1000) / 10; // 1 decimal place
      return {
        platform: p,
        revenue: entry.revenue,
        order_count: entry.order_count,
        percentage: pct,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 4. 30-Day Sales Trend (grouped by day)
    const trendRes = await db.query(`
      SELECT 
        DATE(created_at) AS order_date,
        COALESCE(SUM(total) FILTER (WHERE status IN ('paid', 'shipped', 'completed')), 0) AS daily_revenue,
        COUNT(id) AS daily_orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY order_date ASC
    `);

    const salesTrend = trendRes.rows.map((r) => ({
      date: r.order_date.toISOString().slice(0, 10),
      revenue: Number(r.daily_revenue),
      orders: Number(r.daily_orders),
    }));

    // 5. Low-Stock Alerts
    const lowStockRes = await db.query(`
      SELECT 
        ic.id AS channel_id,
        ic.platform,
        ic.stock,
        ic.low_stock_threshold,
        pv.id AS variant_id,
        pv.sku,
        pv.color,
        pv.size,
        pv.price,
        p.id AS product_id,
        p.name AS product_name,
        p.category
      FROM inventory_channels ic
      JOIN product_variants pv ON ic.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE ic.stock <= ic.low_stock_threshold
      ORDER BY ic.stock ASC, p.name ASC
    `);

    const lowStockAlerts = lowStockRes.rows.map((r) => ({
      channel_id: r.channel_id,
      platform: r.platform,
      stock: Number(r.stock),
      low_stock_threshold: Number(r.low_stock_threshold),
      variant_id: r.variant_id,
      sku: r.sku,
      color: r.color,
      size: r.size,
      price: Number(r.price),
      product_name: r.product_name,
      category: r.category,
    }));

    // 6. Complete SKU Stock Table Across All Platforms
    const skuTableRes = await db.query(`
      SELECT 
        pv.id AS variant_id,
        pv.sku,
        pv.color,
        pv.size,
        pv.price,
        p.id AS product_id,
        p.name AS product_name,
        p.category,
        COALESCE(
          json_agg(
            json_build_object(
              'platform', ic.platform,
              'stock', ic.stock,
              'low_stock_threshold', ic.low_stock_threshold,
              'is_low_stock', ic.stock <= ic.low_stock_threshold
            )
          ) FILTER (WHERE ic.id IS NOT NULL),
          '[]'::json
        ) AS channels,
        COALESCE(SUM(ic.stock), 0) AS total_stock
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN inventory_channels ic ON pv.id = ic.variant_id
      GROUP BY pv.id, p.id
      ORDER BY p.id ASC, pv.sku ASC
    `);

    const skuStockTable = skuTableRes.rows.map((r) => ({
      variant_id: r.variant_id,
      sku: r.sku,
      color: r.color,
      size: r.size,
      price: Number(r.price),
      product_id: r.product_id,
      product_name: r.product_name,
      category: r.category,
      total_stock: Number(r.total_stock),
      channels: r.channels,
      has_low_stock: r.channels.some((c: any) => c.is_low_stock),
    }));

    res.json({
      status: 'success',
      data: {
        summary: {
          total_revenue: Number(summary.total_revenue),
          total_orders: Number(summary.total_orders),
          successful_orders: Number(summary.successful_orders),
          pending_orders: Number(summary.pending_orders),
          returned_orders: Number(summary.returned_orders),
          open_chats: Number(chatStats.open_sessions),
          resolved_chats: Number(chatStats.resolved_sessions),
          total_chats: Number(chatStats.total_sessions),
          avg_response_time_ms: Math.round(Number(csPerf.avg_response_ms)),
          avg_response_time_sec: Math.round(Number(csPerf.avg_response_ms) / 1000),
          total_cs_replies: Number(csPerf.total_cs_replies),
        },
        channel_sales: channelSales,
        sales_trend: salesTrend,
        low_stock_alerts: lowStockAlerts,
        sku_stock_table: skuStockTable,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Analytics Controller Error]:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data analitik dashboard' });
  }
};

export const resetDemoData = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Demo Reset] Resetting database with initial seed data...');
    await runSeeder();

    const io = getIO();
    if (io) {
      console.log('[Socket.io] Emitting demo:reset signal to all connected clients');
      io.emit('demo:reset', { timestamp: new Date().toISOString() });
    }

    res.json({
      status: 'success',
      message: 'Data demo OmniSync CRM berhasil di-reset ke kondisi awal',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Demo Reset Error]:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Gagal mereset data demo' });
  }
};

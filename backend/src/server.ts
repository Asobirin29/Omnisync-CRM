import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { db } from './config/database.js';
import { runSeeder } from './seeds/seed.js';
import { initSocket } from './services/socketService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Setup Socket.io via centralized service
export const io = initSocket(server);

// Auto-check and initialize database on first startup
async function startServer() {
  try {
    console.log('[Server] Checking database state...');
    let shouldSeed = false;

    try {
      const checkTables = await db.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
      `);

      if (Number(checkTables.rows[0].count) === 0) {
        shouldSeed = true;
      } else {
        const prodCount = await db.query(`SELECT COUNT(*) as count FROM products`);
        if (Number(prodCount.rows[0].count) === 0) {
          shouldSeed = true;
        }
      }
    } catch {
      shouldSeed = true;
    }

    if (shouldSeed) {
      console.log('[Server] Database is empty. Running initial seeder automatically...');
      await runSeeder();
    } else {
      console.log('[Server] Database is already initialized and seeded.');
    }

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 OmniSync CRM Backend running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready for real-time events`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📦 Products:     http://localhost:${PORT}/api/products`);
      console.log(`👥 Customers:    http://localhost:${PORT}/api/customers`);
      console.log(`💬 Chats:        http://localhost:${PORT}/api/chats`);
      console.log(`🛍️  Orders:       http://localhost:${PORT}/api/orders`);
      console.log(`⚡ Webhooks:     http://localhost:${PORT}/api/webhooks/:platform/order`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[Server Error] Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  await db.close();
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

startServer();

import { Router, Request, Response } from 'express';
import { db } from '../config/database.js';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbTest = await db.query('SELECT NOW() as db_time');
    res.json({
      status: 'ok',
      service: 'OmniSync CRM Backend API',
      version: '1.0.0',
      database: 'connected',
      db_time: dbTest.rows[0].db_time,
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      service: 'OmniSync CRM Backend API',
      database: 'disconnected',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

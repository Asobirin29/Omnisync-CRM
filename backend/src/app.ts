import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow development frontend requests
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger for development
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${_res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root welcome endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'OmniSync CRM API',
    description: 'Omnichannel CRM Backend for Rancaekek Supply Co.',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      customers: '/api/customers',
      customer_detail: '/api/customers/:id',
      chats: '/api/chats',
      chat_messages: '/api/chats/:id/messages',
      orders: '/api/orders'
    }
  });
});

// Mount API routes
app.use('/api', apiRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Terjadi kesalahan internal pada server'
  });
});

export default app;

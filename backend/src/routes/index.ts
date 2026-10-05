import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import productRoutes from './productRoutes.js';
import customerRoutes from './customerRoutes.js';
import chatRoutes from './chatRoutes.js';
import orderRoutes from './orderRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import { resetDemoData } from '../controllers/analyticsController.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/chats', chatRoutes);
router.use('/orders', orderRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/analytics', analyticsRoutes);
router.post('/demo/reset', resetDemoData);

export default router;

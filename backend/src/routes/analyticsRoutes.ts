import { Router } from 'express';
import { getDashboardAnalytics, resetDemoData } from '../controllers/analyticsController.js';

const router = Router();

router.get('/dashboard', getDashboardAnalytics);
router.post('/demo/reset', resetDemoData);
router.post('/reset', resetDemoData);

export default router;

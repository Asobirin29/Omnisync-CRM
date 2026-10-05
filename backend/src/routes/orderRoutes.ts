import { Router } from 'express';
import { getOrders, createManualOrder, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.get('/', getOrders);
router.post('/', createManualOrder);
router.post('/manual', createManualOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;

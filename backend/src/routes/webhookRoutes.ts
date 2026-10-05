import { Router } from 'express';
import { handleOrderWebhook, handleMessageWebhook } from '../controllers/webhookController.js';

const router = Router();

router.post('/:platform/order', handleOrderWebhook);
router.post('/:platform/message', handleMessageWebhook);

export default router;

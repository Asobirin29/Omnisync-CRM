import { Router } from 'express';
import { getChats, getChatMessages, sendCSMessage } from '../controllers/chatController.js';

const router = Router();

router.get('/', getChats);
router.get('/:id/messages', getChatMessages);
router.post('/:id/messages', sendCSMessage);

export default router;

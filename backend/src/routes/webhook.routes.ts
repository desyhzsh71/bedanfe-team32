import { Router } from 'express';
import { handleMidtransWebhook } from '../controllers/webhook';

const router = Router();

router.post('/midtrans', handleMidtransWebhook);

export default router;
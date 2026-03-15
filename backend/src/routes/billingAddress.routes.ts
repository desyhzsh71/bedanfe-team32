import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth'; 
import {
    createOrUpdateBillingAddress,
    getBillingAddress,
} from '../controllers/billingAddress';

const router = Router();

router.post('/billing-address', authMiddleware, createOrUpdateBillingAddress);
router.get('/billing-address', getBillingAddress);

export default router;
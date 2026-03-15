import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth'; 
import {
    createSubscription,
    getCurrentSubscription,
    upgradeSubscription,
    cancelSubscription,
} from '../controllers/subscription';

const router = Router();

router.post('/organizations/:organizationId/subscription', authMiddleware, createSubscription);
router.get('/organizations/:organizationId/subscription', authMiddleware, getCurrentSubscription);
router.patch('/organizations/:organizationId/subscription/upgrade', authMiddleware, upgradeSubscription);
router.patch('/organizations/:organizationId/subscription/cancel', authMiddleware, cancelSubscription);

export default router;
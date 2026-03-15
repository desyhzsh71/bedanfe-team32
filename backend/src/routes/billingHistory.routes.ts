import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth'; 
import {
    getBillingHistory,
    downloadInvoice,
} from '../controllers/billingHistory';

const router = Router();

router.get('/organizations/:organizationId/billing-history', authMiddleware, getBillingHistory);
router.get('/organizations/:organizationId/billing-history/:invoiceId/download', authMiddleware, downloadInvoice);

export default router;
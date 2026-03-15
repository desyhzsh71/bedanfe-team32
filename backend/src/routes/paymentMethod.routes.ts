import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth'; 
import {
    addPaymentMethod,
    getAllPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
} from '../controllers/paymentMethod';

const router = Router();

router.post('/payment-methods', authMiddleware, addPaymentMethod);
router.get('/payment-methods', authMiddleware, getAllPaymentMethods);
router.patch('/payment-methods/:id/default', authMiddleware, setDefaultPaymentMethod);
router.delete('/payment-methods/:id', authMiddleware, deletePaymentMethod);

export default router;
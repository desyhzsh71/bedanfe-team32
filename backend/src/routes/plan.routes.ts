import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth'; 
import { getAllPlans, getPlanById, comparePlans } from '../controllers/plan';

const router = Router();

// public -> bisa diakses tanpa login
router.get('/plans', getAllPlans);
router.get('/plans/compare', comparePlans);
router.get('/plans/:id', getPlanById);

export default router;
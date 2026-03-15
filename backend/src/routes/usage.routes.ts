import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth'; 
import { getCurrentUsage } from '../controllers/usage';

const router = Router();

router.get('/organizations/:organizationId/usage', authMiddleware, getCurrentUsage);

export default router;
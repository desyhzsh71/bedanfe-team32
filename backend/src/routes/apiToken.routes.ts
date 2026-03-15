import { Router } from "express";
import {
    createApiToken,
    getAllApiTokens,
    getApiTokenById,
    getApiTokenUsageLogs,
    updateApiToken,
    revokeApiToken,
    deleteApiToken,
} from '../controllers/apiToken'
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/organizations/:organizationId/tokens", authMiddleware, createApiToken);
router.get("/organizations/:organizationId/tokens", authMiddleware, getAllApiTokens);
router.get("/tokens/:id", authMiddleware, getApiTokenById);
router.get("/tokens/:id/usage-logs", authMiddleware, getApiTokenUsageLogs);
router.put("/tokens/:id", authMiddleware, updateApiToken);
router.patch("/tokens/:id/revoke", authMiddleware, revokeApiToken);
router.delete("/tokens/:id", authMiddleware, deleteApiToken);

export default router;
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
    getContentStructure,
    saveContent,
    getCurrentContent,
    previewContent,
} from "../controllers/contentBuilder/contentManagement";

const router = Router();

router.get("/single-pages/:singlePageId/structure", authMiddleware, getContentStructure);
router.post("/single-pages/:singlePageId/content", authMiddleware, saveContent);
router.get("/single-pages/:singlePageId/content", authMiddleware, getCurrentContent);
router.get("/single-pages/:singlePageId/preview", authMiddleware, previewContent);

export default router;
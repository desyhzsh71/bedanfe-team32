import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
    getAllFolders,
    getFolderById,
    createFolder,
    updateFolder,
    deleteFolder,
} from "../controllers/mediaFolder";

const router = Router();

router.get("/organizations/:organizationId/media-folders", authMiddleware, getAllFolders);
router.get("/organizations/:organizationId/media-folders/:id", authMiddleware, getFolderById);
router.post("/organizations/:organizationId/media-folders", authMiddleware, createFolder);
router.patch("/organizations/:organizationId/media-folders/:id", authMiddleware, updateFolder);
router.delete("/organizations/:organizationId/media-folders/:id", authMiddleware, deleteFolder);

export default router;
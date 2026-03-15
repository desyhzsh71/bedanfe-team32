import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import { 
    getAllMediaAssets,
    getMediaAssetById,
    uploadMediaAsset,
    updateMediaAsset,
    deleteMediaAsset,
    bulkDeleteMediaAssets,
} from "../controllers/mediaAsset";

const router = Router();

router.get("/organizations/:organizationId/media-assets", authMiddleware, getAllMediaAssets);
router.get("/organizations/:organizationId/media-assets/:id", authMiddleware, getMediaAssetById);

router.post("/organizations/:organizationId/media-assets", authMiddleware, upload.array('files', 10), uploadMediaAsset);

router.patch("/organizations/:organizationId/media-assets/:id", authMiddleware, updateMediaAsset);
router.delete("/organizations/:organizationId/media-assets/:id", authMiddleware, deleteMediaAsset);

router.post("/organizations/:organizationId/media-assets/bulk-delete", authMiddleware, bulkDeleteMediaAssets);

export default router;
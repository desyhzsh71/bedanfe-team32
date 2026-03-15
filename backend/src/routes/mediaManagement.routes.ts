import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
    uploadMedia,
    getAllMedia,
    deleteMedia,
    upload,
} from "../controllers/contentBuilder/mediaManagement";

const router = Router();

router.post("/upload", authMiddleware, upload.single('file'), uploadMedia);
router.get("/", authMiddleware, getAllMedia);
router.delete("/:filename", authMiddleware, deleteMedia);

export default router;
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  getPersonalProjects,
  getPersonalProjectById,
  createPersonalProject,
  updatePersonalProject,
  deletePersonalProject,
  duplicatePersonalProject,
} from "../controllers/personalProject";

const router = Router();

router.get("/", authMiddleware, getPersonalProjects);
router.post("/", authMiddleware, createPersonalProject);
router.get("/:projectId", authMiddleware, getPersonalProjectById);
router.put("/:projectId", authMiddleware, updatePersonalProject);
router.delete("/:projectId", authMiddleware, deletePersonalProject);
router.post( "/:projectId/duplicate", authMiddleware, duplicatePersonalProject);


export default router;
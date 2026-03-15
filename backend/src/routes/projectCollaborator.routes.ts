import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  addProjectCollaborator,
  getProjectCollaborators,
  updateProjectCollaboratorRole,
  removeProjectCollaborator,
} from "../controllers/projectCollaborator";

const router = Router();

router.post("/", authMiddleware, addProjectCollaborator); 
router.get("/:projectId", authMiddleware, getProjectCollaborators); 
router.put("/:projectId/:collaboratorId", authMiddleware, updateProjectCollaboratorRole); 
router.delete("/:projectId/:collaboratorId", authMiddleware, removeProjectCollaborator);

export default router;
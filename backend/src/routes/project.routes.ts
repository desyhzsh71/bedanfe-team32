import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  duplicateProject,
  duplicateProjectToOrganization,
  updateCustomDomain,
} from "../controllers/project";
import { duplicateProjectToPersonal } from "../controllers/project/duplicateToPersonal";

const router = Router();

router.post("/", authMiddleware, createProject); 
router.get("/", authMiddleware, getProjects); 
router.get("/:id", authMiddleware, getProjectById); 
router.put("/:id", authMiddleware, updateProject);
router.delete("/:id", authMiddleware, deleteProject);
router.post("/:id/duplicate", authMiddleware, duplicateProject);
router.post("/:id/duplicate-to-org", authMiddleware, duplicateProjectToOrganization);
router.post("/:id/duplicate-to-personal", authMiddleware, duplicateProjectToPersonal); 
router.put("/:id/custom-domain", authMiddleware, updateCustomDomain);

export default router;
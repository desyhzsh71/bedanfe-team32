import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { isOwner, isActiveMember } from "../middlewares/checkRole";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from "../controllers/organization";

const router = Router();

router.post("/", authMiddleware, createOrganization); 
router.get("/", authMiddleware, getOrganizations);
router.get("/:id", authMiddleware, isActiveMember, getOrganizationById);
router.put("/:id", authMiddleware, isOwner, updateOrganization);
router.delete("/:id", authMiddleware, isOwner, deleteOrganization);

export default router;
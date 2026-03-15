import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { isOwner, isActiveMember } from "../middlewares/checkRole";
import {
  addCollaborator,
  getCollaborators,
  getUserInvitations,
  respondToInvitation,
  updateCollaboratorRole,
  deleteCollaborator
} from "../controllers/collaborator";

const router = Router();

router.get("/invitations", authMiddleware, getUserInvitations); 
router.post("/", authMiddleware, isOwner, addCollaborator); 
router.get("/:organizationId", authMiddleware, isActiveMember, getCollaborators); 
router.put("/:memberId/respond", authMiddleware, respondToInvitation); 
router.put("/:memberId/role", authMiddleware, isOwner, updateCollaboratorRole); 
router.delete("/:memberId", authMiddleware, isOwner, deleteCollaborator);

export default router;
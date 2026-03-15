import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
    createWorkflow,
    getAllWorkflows,
    getWorkflowById,
    getWorkflowForPage,
    getContentCurrentStage,
    getContentWorkflowHistory,
    updateWorkflow,
    deleteWorkflow,
    assignWorkflow,
    removeWorkflowAssignment,
    moveContentToStage,
} from '../controllers/workflow';

const router = Router();

router.post("/organizations/:organizationId/workflows", authMiddleware, createWorkflow);
router.get("/organizations/:organizationId/workflows", authMiddleware, getAllWorkflows);
router.get("/workflows/:id", authMiddleware, getWorkflowById);
router.put("/workflows/:id", authMiddleware, updateWorkflow);
router.delete("/workflows/:id", authMiddleware, deleteWorkflow);
router.post("/workflow-assignments", authMiddleware, assignWorkflow);
router.delete("/workflow-assignments/:id", authMiddleware, removeWorkflowAssignment);
router.get("/pages/:pageType/:pageId/workflow", authMiddleware, getWorkflowForPage);
router.post("/content/move-to-stage", authMiddleware, moveContentToStage);
router.get("/content/:contentType/:contentId/current-stage", authMiddleware, getContentCurrentStage);
router.get("/content/:contentType/:contentId/workflow-history", authMiddleware, getContentWorkflowHistory);

export default router;
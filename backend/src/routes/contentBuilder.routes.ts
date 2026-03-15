import { Router } from "express";
import {
    createSinglePage,
    getAllSinglePagesByProject,
    getSinglePageById,
    updateSinglePage,
    deleteSinglePage,
    togglePublishSinglePage,
} from "../controllers/contentBuilder/singlePage";

import {
    createMultiplePage,
    getAllMultiplePageProject,
    getMultiplePageById,
    updateMultiplePage,
    deleteMultiplePage,
    togglePublishMultiplePage,
} from "../controllers/contentBuilder/multiplePage";

import {
    cretaeComponent,
    getAllComponentsByProject,
    getAllComponentsById,
    updateComponent,
    deleteComponent,
} from "../controllers/contentBuilder/component";

import {
    createField,
    getAllFieldsByParent,
    getFieldById,
    updateField,
    deleteField,
    reorderFields,
    duplicateField,
} from "../controllers/contentBuilder/field";

import {
    upsertSinglePageContent,
    getSinglePageContent,
    deleteSinglePageContent,
    createEntry,
    getAllEntries,
    getEntrybyId,
    updateEntry,
    deleteEntry,
    togglePublishEntry,
    bulkDeleteEntries,
} from "../controllers/contentBuilder/content";

import { authMiddleware } from "../middlewares/auth";
import { checkProjectAccess } from "../middlewares/checkProjectPermission";

const router = Router();

// routes single page
router.post("/projects/:projectId/single-pages", authMiddleware, createSinglePage);
router.get("/projects/:projectId/single-pages", authMiddleware, checkProjectAccess, getAllSinglePagesByProject);
router.get("/single-pages/:id", authMiddleware, getSinglePageById);
router.put("/single-pages/:id", authMiddleware, updateSinglePage);
router.delete("/single-pages/:id", authMiddleware, deleteSinglePage);
router.patch("/single-pages/:id/toggle-publish", authMiddleware, togglePublishSinglePage);

// routes multiple page
router.post("/projects/:projectId/multiple-pages", authMiddleware, checkProjectAccess, createMultiplePage);
router.get("/projects/:projectId/multiple-pages", authMiddleware, checkProjectAccess, getAllMultiplePageProject);
router.get("/multiple-pages/:id", authMiddleware, getMultiplePageById);
router.put("/multiple-pages/:id", authMiddleware, updateMultiplePage);
router.delete("/multiple-pages/:id", authMiddleware, deleteMultiplePage);
router.patch("/multiple-pages/:id/toggle-publish", authMiddleware, togglePublishMultiplePage);

// routes component
router.post("/projects/:projectId/components", authMiddleware, checkProjectAccess, cretaeComponent);
router.get("/projects/:projectId/components", authMiddleware, checkProjectAccess, getAllComponentsByProject);
router.get("/components/:id", authMiddleware, getAllComponentsById);
router.put("/components/:id", authMiddleware, updateComponent);
router.delete("/components/:id", authMiddleware, deleteComponent);

// routes field
router.post('/fields', authMiddleware, createField);
router.get('/:parentType/:parentId/fields', authMiddleware, getAllFieldsByParent);
router.get('/fields/:id', authMiddleware, getFieldById);
router.put('/fields/:id', authMiddleware, updateField);
router.delete('/fields/:id', authMiddleware, deleteField);
router.post('/fields/reorder', authMiddleware, reorderFields);
router.post('/fields/:id/duplicate', authMiddleware, duplicateField);

// routes single page content
router.put('/single-pages/:singlePageId/content', authMiddleware, upsertSinglePageContent);
router.get('/single-pages/:singlePageId/content', authMiddleware, getSinglePageContent);
router.delete('/single-pages/:singlePageId/content', authMiddleware, deleteSinglePageContent);

// routes multiple page entries
router.post('/multiple-pages/:multiplePageId/entries', authMiddleware, createEntry);
router.get('/multiple-pages/:multiplePageId/entries', authMiddleware, getAllEntries);
router.get('/entries/:id', authMiddleware, getEntrybyId);
router.put('/entries/:id', authMiddleware, updateEntry);
router.delete('/entries/:id', authMiddleware, deleteEntry);
router.patch('/entries/:id/toggle-publish', authMiddleware, togglePublishEntry);
router.post('/entries/bulk-delete', authMiddleware, bulkDeleteEntries);

export default router;
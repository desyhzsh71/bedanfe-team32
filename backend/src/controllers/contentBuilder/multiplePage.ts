import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { generateApiId } from "../../utils/generateApiId";
import { success } from "zod";
import { ca, tr } from "zod/v4/locales";

// create multiple page
export async function createMultiplePage(req: Request, res: Response) {
    try {
        const { projectId } = req.params;
        const { name, apiId, multiLanguage = false, seoEnabled = false, workflowEnabled = false } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required',
            });
        }

        // mengecek apakah project ada atau tidak
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // generate apiId
        const finalApiId = apiId || generateApiId(name);

        // mengecek apakah apiId sudah digunakan dalam project
        const existingPage = await prisma.multiplePage.findUnique({
            where: {
                projectId_apiId: {
                    projectId, apiId: finalApiId,
                },
            },
        });

        if (existingPage) {
            return res.status(400).json({
                success: false,
                message: 'API ID already exists in this project',
            });
        }

        const multiplePage = await prisma.multiplePage.create({
            data: {
                projectId, name, apiId: finalApiId, multiLanguage, seoEnabled, workflowEnabled
            }, include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Multiple page created successfully',
            data: multiplePage,
        });
    } catch (error) {
        console.error('Create multiple page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create multiple page',
        });
    }
}

// get all multiple pages berdasarkan project
export async function getAllMultiplePageProject(req: Request, res: Response) {
    try {
        const { projectId } = req.params;

        const multiplePages = await prisma.multiplePage.findMany({
            where: { projectId },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                entries: {
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            data: multiplePages,
        });
    } catch (error) {
        console.error('Get multiple pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch multiple pages',
        });
    }
}

// get multiple page berdasarkan id
export async function getMultiplePageById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const multiplePage = await prisma.multiplePage.findUnique({
            where: { id },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                entries: {
                    orderBy: { createdAt: 'desc' },
                },
                project: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!multiplePage) {
            return res.status(404).json({
                success: false,
                message: 'Multiple page not found',
            });
        }

        res.status(200).json({
            success: true,
            data: multiplePage,
        });
    } catch (error) {
        console.error('Get multiple page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch multiple page',
        });
    }
}

// update multiple page
export async function updateMultiplePage(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, apiId, multiLanguage, seoEnabled, workflowEnabled, published } = req.body;

        const multiplePage = await prisma.multiplePage.findUnique({
            where: { id },
        });

        if (!multiplePage) {
            return res.status(404).json({
                success: false,
                message: 'Multiple page not found',
            });
        }

        // jika apiId diubah, cek apakah sudah digunakan atau belum
        if (apiId && apiId !== multiplePage.apiId) {
            const existingPage = await prisma.multiplePage.findUnique({
                where: {
                    projectId_apiId: {
                        projectId: multiplePage.projectId, apiId,
                    },
                },
            });

            if (existingPage) {
                return res.status(400).json({
                    success: false,
                    message: 'API ID already exists in this project',
                });
            }
        }

        const updatedPage = await prisma.multiplePage.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(apiId && { apiId }),
                ...(multiLanguage !== undefined && { multiLanguage }),
                ...(seoEnabled !== undefined && { seoEnabled }),
                ...(workflowEnabled !== undefined && { workflowEnabled }),
                ...(published !== undefined && { published }),
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Multiple page updated successfully',
            data: updatedPage,
        });
    } catch (error) {
        console.error('Update multiple page errpr:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update multiple page',
        });
    }
}

// delete multiple page
export async function deleteMultiplePage(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const multiplePage = await prisma.multiplePage.findUnique({
            where: { id },
        });

        if (!multiplePage) {
            return res.status(404).json({
                success: false,
                message: 'Multiple page not found',
            });
        }

        // delete ke fields dan entries
        await prisma.multiplePage.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Multiple page deleted successfully',
        });
    } catch (error) {
        console.error('Delete multiple page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete multiple page',
        });
    }
}

// publish/unpublish single page
export async function togglePublishMultiplePage(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const multiplePage = await prisma.multiplePage.findUnique({
            where: { id },
        });

        if (!multiplePage) {
            return res.status(404).json({
                success: false,
                message: 'Multiple page not found',
            });
        }

        const updatedPage = await prisma.multiplePage.update({
            where: { id },
            data: {
                published: !multiplePage.published,
            },
        });

        res.status(200).json({
            success: true,
            message: `Multiple page ${updatedPage.published ? 'published' : 'unpublished'} successfully`,
            data: updatedPage,
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle publish status',
        });
    }
}
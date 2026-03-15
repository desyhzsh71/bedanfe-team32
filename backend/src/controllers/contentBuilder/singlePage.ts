import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { generateApiId } from "../../utils/generateApiId";
import { date, success } from "zod";
import { fa, tr } from "zod/v4/locales";

// create single page
export async function createSinglePage(req: Request, res: Response) {
    try {
        const { projectId } = req.params;
        const { name, apiId, multiLanguage = false,
            seoEnabled = false, workflowEnabled = false,
        } = req.body;

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
        const existingPage = await prisma.singlePage.findUnique({
            where: {
                projectId_apiId: {
                    projectId, apiId: finalApiId,
                },
            },
        });

        // Hanya cek duplicate untuk organizational projects
        if (project.organizationId) {
            const existingPage = await prisma.singlePage.findUnique({
                where: { projectId_apiId: { projectId, apiId: finalApiId } }
            });

            if (existingPage) {
                return res.status(400).json({
                    success: false,
                    message: 'API ID already exists in this project',
                });
            }
        }

        const singlePage = await prisma.singlePage.create({
            data: {
                projectId, name, apiId: finalApiId, multiLanguage, seoEnabled, workflowEnabled,
            }, include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Single page created successfully',
            data: singlePage,
        });
    } catch (error) {
        console.error('Create single page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create single page',
        });
    }
}

// get all single pages berdasarkan project
export async function getAllSinglePagesByProject(req: Request, res: Response) {
    try {
        const { projectId } = req.params;

        const singlePages = await prisma.singlePage.findMany({
            where: { projectId },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                content: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            data: singlePages,
        });
    } catch (error) {
        console.error('Get single pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch single pages',
        });
    }
}

// get single page berdasarkan id
export async function getSinglePageById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const singlePage = await prisma.singlePage.findUnique({
            where: { id },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                content: true,
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!singlePage) {
            return res.status(404).json({
                success: false,
                message: 'Single page not found',
            });
        }

        res.status(200).json({
            success: true,
            data: singlePage,
        });
    } catch (error) {
        console.error('Get single page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch single page',
        });
    }
}

// update single page
export async function updateSinglePage(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, apiId, multiLanguage, seoEnabled, workflowEnabled, published } = req.body;

        const singlePage = await prisma.singlePage.findUnique({
            where: { id },
        });

        if (!singlePage) {
            return res.status(404).json({
                success: false,
                message: 'Single page not found',
            });
        }

        // jika apiId diubah, cek apakah sudah digunakan atau belum
        if (apiId && apiId !== singlePage.apiId) {
            const existingPage = await prisma.singlePage.findUnique({
                where: {
                    projectId_apiId: {
                        projectId: singlePage.projectId, apiId,
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

        const updatePage = await prisma.singlePage.update({
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
            message: 'Single page updated successfully',
            data: updatePage,
        });
    } catch (error) {
        console.error('Update single page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update single page',
        });
    }
}

// delete single page
export async function deleteSinglePage(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const singlePage = await prisma.singlePage.findUnique({
            where: { id },
        });

        if (!singlePage) {
            return res.status(404).json({
                success: false,
                message: 'Single page not found',
            });
        }

        // delete ke fields dan content
        await prisma.singlePage.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Single page deleted successfully',
        });
    } catch (error) {
        console.error('Delete single page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete single page',
        });
    }
}

// publish/unpublish single page
export async function togglePublishSinglePage(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const singlePage = await prisma.singlePage.findUnique({
            where: { id },
        });

        if (!singlePage) {
            return res.status(404).json({
                success: false,
                message: 'Single page not found',
            });
        }

        const updatedPage = await prisma.singlePage.update({
            where: { id },
            data: {
                published: !singlePage.published,
            },
        });

        res.status(200).json({
            success: true,
            message: `Single page ${updatedPage.published ? 'published' : 'unpublished'} successfully`,
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle publish status',
        });
    }
}
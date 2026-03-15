import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { generateApiId } from "../../utils/generateApiId";
import { success } from "zod";
import { fa, tr } from "zod/v4/locales";

// create component
export async function cretaeComponent(req: Request, res: Response) {
    try {
        const { projectId } = req.params;
        const { name, apiId } = req.body;

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
        const existingComponent = await prisma.component.findUnique({
            where: {
                projectId_apiId: {
                    projectId, apiId: finalApiId,
                },
            },
        });

        if (existingComponent) {
            return res.status(400).json({
                success: false,
                message: 'API ID already exists in this project',
            });
        }

        const component = await prisma.component.create({
            data: {
                projectId, name,
                apiId: finalApiId,
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Component cretaed successfully',
            data: component,
        });
    } catch (error) {
        console.error('Create component error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create component',
        });
    }
}

// get all components berdasarkan project
export async function getAllComponentsByProject(req: Request, res: Response) {
    try {
        const { projectId } = req.params;

        const components = await prisma.component.findMany({
            where: { projectId },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            data: components,
        });
    } catch (error) {
        console.error('Get components error:', error);
        res.status(500).json({
            success: false,
            mesage: 'Failed to fetch components',
        });
    }
}

// get component berdasarkan id
export async function getAllComponentsById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const component = await prisma.component.findUnique({
            where: { id },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
                project: {
                    select: {
                        id: true, name: true
                    },
                },
            },
        });

        if (!component) {
            return res.status(404).json({
                success: false,
                message: 'Component not found',
            });
        }

        res.status(200).json({
            success: true,
            data: component,
        });
    } catch (error) {
        console.error('Get component error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch component',
        });
    }
}

// update component
export async function updateComponent(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, apiId } = req.body;

        const component = await prisma.component.findUnique({
            where: { id },
        });

        if (!component) {
            return res.status(404).json({
                success: false,
                message: 'Component not found',
            });
        }

        // jika apiId diubah, cek apakah sudah digunakan atau belum
        if (apiId && apiId !== component.apiId) {
            const existingComponent = await prisma.component.findUnique({
                where: {
                    projectId_apiId: {
                        projectId: component.projectId, apiId,
                    },
                },
            });

            if (existingComponent) {
                return res.status(400).json({
                    success: false,
                    message: 'API ID already exists in this project',
                });
            }
        }

        const updatedcomponent = await prisma.component.update({
            where: { id },
            data: { 
                ...(name && { name }),
                ...(apiId && { apiId }), 
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Component updated successfully',
            data: updatedcomponent,
        });
    } catch (error) {
        console.error('Update component error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update component',
        });
    }
}

// delete component
export async function deleteComponent(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const component = await prisma.component.findUnique({
            where: { id },
        });

        if (!component) {
            return res.status(404).json({
                success: false,
                message: 'Component not found',
            });
        }

        // delete ke fields
        await prisma.component.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Component deleted successfully',
        });
    } catch (error) {
        console.error('Delete component error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete component',
        });
    }
}
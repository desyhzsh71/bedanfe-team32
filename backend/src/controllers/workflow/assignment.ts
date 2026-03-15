import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// tetapkan workflow untuk single page & multiple page
export async function assignWorkflow(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { workflowId, singlePageId, multiplePageId } = req.body;

        // validasi -> harus ada salah satu
        if (!singlePageId && !multiplePageId) {
            return res.status(400).json({
                success: false,
                message: 'Either singlePageId or multiplePageId is required',
            });
        }

        // validasi -> tidak boleh keduanya
        if (singlePageId && multiplePageId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign workflow to both single page and multiple page',
            });
        }

        if (!workflowId) {
            return res.status(400).json({
                success: false,
                message: 'Workflow ID is required',
            });
        }

        // mengecek workflow
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
            include: {
                organization: {
                    include: {
                        members: {
                            where: { userId, status: 'ACTIVE' },
                        },
                    },
                },
            },
        });

        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }

        // mengecek akses -> hanya owner dan member aktif yang boleh
        const isOwner = workflow.organization.ownerId === userId;
        const isMember = workflow.organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this workflow',
            });
        }

        // mengecek apakah halaman ada atau tidak
        if (singlePageId) {
            const page = await prisma.singlePage.findUnique({
                where: { id: singlePageId },
            });

            if (!page) {
                return res.status(404).json({
                    success: false,
                    message: 'Single page not found',
                });
            }
        }

        if (multiplePageId) {
            const page = await prisma.multiplePage.findUnique({
                where: { id: multiplePageId },
            });

            if (!page) {
                return res.status(404).json({
                    success: false,
                    message: 'Multiple page not found',
                });
            }
        }

        // create assignment
        const assignment = await prisma.workflowAssignment.create({
            data: {
                workflowId,
                ...(singlePageId && { singlePageId }),
                ...(multiplePageId && { multiplePageId }),
            },
            include: {
                workflow: {
                    include: {
                        stages: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Workflow assigned successfully',
            data: assignment,
        });
    } catch (error) {
        console.error('Assign workflow error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign workflow',
        });
    }
}

// remove workflow assignment
export async function removeWorkflowAssignment(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const assignment = await prisma.workflowAssignment.findUnique({
            where: { id },
            include: {
                workflow: {
                    include: {
                        organization: {
                            include: {
                                members: {
                                    where: { userId, status: 'ACTIVE' },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Workflow assignment not found',
            });
        }

        // mengecek akses -> hanya owner dan member aktif yang boleh
        const isOwner = assignment.workflow.organization.ownerId === userId;
        const isMember = assignment.workflow.organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this workflow assignment',
            });
        }

        // delete assignment
        await prisma.workflowAssignment.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Workflow assignment removed successfully',
        });
    } catch (error) {
        console.error('Remove workflow assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove workflow assignment',
        });
    }
}

// get workflow untuk halaman tertentu
export async function getWorkflowForPage(req: Request, res: Response) {
    try {
        const { pageType, pageId } = req.params; // pageType: single / multiple

        const whereClause: any = {};
        if (pageType === 'single') {
            whereClause.singlePageId = pageId;
        } else if (pageType === 'multiple') {
            whereClause.multiplePageId = pageId;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid page type. Must be "single" or "multiple"',
            });
        }

        const assignment = await prisma.workflowAssignment.findFirst({
            where: whereClause,
            include: {
                workflow: {
                    include: {
                        stages: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'No workflow assigned to this page',
            });
        }

        res.status(200).json({
            success: true,
            data: assignment,
        });
    } catch (error) {
        console.error('Get workflow for page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow for page',
        });
    }
}
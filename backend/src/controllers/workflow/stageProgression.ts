import { Request, Response } from 'express';
import { ContentType } from '../../generated';
import prisma from '../../utils/prisma';

export async function moveContentToStage(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const {
            contentType,
            contentId,
            workflowStageId,
            notes,
        } = req.body;

        // validasi content type
        if (!['SINGLE_PAGE', 'MULTIPLE_PAGE'].includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid content type',
            });
        }

        if (!contentId || !workflowStageId) {
            return res.status(400).json({
                success: false,
                message: 'Content ID and workflow stage ID are required',
            });
        }

        // mengecek apakah stage ada atau tidak
        const stage = await prisma.workflowStage.findUnique({
            where: { id: workflowStageId },
            include: {
                workflow: true,
            },
        });

        if (!stage) {
            return res.status(404).json({
                success: false,
                message: 'Workflow stage not found',
            });
        }

        const rolesAllowed = stage.rolesAllowed as string[];
        // memeriksa apakah pengguna memiliki salah satu peran yang diizinkan

        // mengecek content
        if (contentType === 'SINGLE_PAGE') {
            const content = await prisma.singlePageContent.findUnique({
                where: { id: contentId },
            });

            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Single page content not found',
                });
            }
        } else {
            const entry = await prisma.multiplePageEntry.findUnique({
                where: { id: contentId },
            });

            if (!entry) {
                return res.status(404).json({
                    success: false,
                    message: 'Multiple page entry not found',
                });
            }
        }

        // content workflow stage
        const contentWorkflowStage = await prisma.contentWorkflowStage.upsert({
            where: {
                contentType_contentId: {
                    contentType: contentType as ContentType,
                    contentId,
                },
            },
            update: {
                workflowStageId,
                approvedBy: userId,
                approvedAt: new Date(),
                ...(notes && { notes }),
            },
            create: {
                workflowStageId,
                contentType: contentType as ContentType,
                contentId,
                approvedBy: userId,
                approvedAt: new Date(),
                ...(notes && { notes }),
            },
            include: {
                workflowStage: {
                    include: {
                        workflow: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        // memeriksa apakah konten sudah mencapai tahap persetujuan
        const workflow = stage.workflow;
        const isKeyStage = stage.name === workflow.keyApprovalStage;

        if (isKeyStage) {
            // auto-publish jika telah mencapai tahap persetujuan
            if (contentType === 'SINGLE_PAGE') {
                await prisma.singlePageContent.update({
                    where: { id: contentId },
                    data: {
                        // menambahkan kolom 'dipublikasikan' jika ingin melacak
                    },
                });
            } else {
                await prisma.multiplePageEntry.update({
                    where: { id: contentId },
                    data: {
                        published: true,
                    },
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Content moved to stage: ${stage.name}${isKeyStage ? ' (Published)' : ''}`,
            data: {
                ...contentWorkflowStage,
                isKeyApprovalStage: isKeyStage,
            },
        });
    } catch (error) {
        console.error('Move content to stage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to move content to stage',
        });
    }
}

// get current stage
export async function getContentCurrentStage(req: Request, res: Response) {
    try {
        const { contentType, contentId } = req.params;

        if (!['SINGLE_PAGE', 'MULTIPLE_PAGE'].includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid content type',
            });
        }

        const contentWorkflowStage = await prisma.contentWorkflowStage.findUnique({
            where: {
                contentType_contentId: {
                    contentType: contentType as ContentType,
                    contentId,
                },
            },
            include: {
                workflowStage: {
                    include: {
                        workflow: {
                            include: {
                                stages: {
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        if (!contentWorkflowStage) {
            return res.status(404).json({
                success: false,
                message: 'Content is not in any workflow stage',
            });
        }

        res.status(200).json({
            success: true,
            data: contentWorkflowStage,
        });
    } catch (error) {
        console.error('Get content current stage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content stage',
        });
    }
}

// get workflow history untuk content
export async function getContentWorkflowHistory(req: Request, res: Response) {
    try {
        const { contentType, contentId } = req.params;
        const currentStage = await prisma.contentWorkflowStage.findUnique({
            where: {
                contentType_contentId: {
                    contentType: contentType as ContentType,
                    contentId,
                },
            },
            include: {
                workflowStage: true,
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: {
                current: currentStage,
                history: [],
            },
        });
    } catch (error) {
        console.error('Get content workflow history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow history',
        });
    }
}
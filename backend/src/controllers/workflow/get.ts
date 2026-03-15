import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// get all workflows berdasarkan organisasi
export async function getAllWorkflows(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;

        // validasi akses ke organisasi
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                members: {
                    where: { userId, status: 'ACTIVE' },
                },
            },
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // mengecek akses -> hanya owner dan member aktif yang boleh
        const isOwner = organization.ownerId === userId;
        const isMember = organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this organization',
            });
        }

        // get all workflow
        const workflows = await prisma.workflow.findMany({
            where: { organizationId },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { stages: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // format respons
        const formattedWorkflows = workflows.map((workflow) => ({
            id: workflow.id,
            name: workflow.name,
            relatedTo: workflow.relatedTo,
            keyApprovalStage: workflow.keyApprovalStage,
            stages: workflow.stages,
            stagesCount: workflow._count.stages,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
        }));

        res.status(200).json({
            success: true,
            data: formattedWorkflows,
        });
    } catch (error) {
        console.error('Get all workflows error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflows',
        });
    }
}

// get single workflow berdasarkan ID
export async function getWorkflowById(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const workflow = await prisma.workflow.findUnique({
            where: { id },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
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

        res.status(200).json({
            success: true,
            data: workflow,
        });
    } catch (error) {
        console.error('Get workflow by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow',
        });
    }
}
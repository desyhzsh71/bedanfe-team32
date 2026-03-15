import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// update workflow
export async function updateWorkflow(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, relatedTo, keyApprovalStage, stages } = req.body;

        const workflow = await prisma.workflow.findUnique({
            where: { id },
            include: {
                organization: {
                    include: {
                        members: {
                            where: { userId, status: 'ACTIVE' },
                        },
                    },
                },
                stages: true,
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

        // mengecek apakah nama yang akan diubah sudah ada atau tidak
        if (name && name !== workflow.name) {
            const existingWorkflow = await prisma.workflow.findUnique({
                where: {
                    organizationId_name: {
                        organizationId: workflow.organizationId,
                        name,
                    },
                },
            });

            if (existingWorkflow) {
                return res.status(400).json({
                    success: false,
                    message: 'Workflow with this name already exists',
                });
            }
        }

        // validate keyApprovalStage
        if (stages && keyApprovalStage) {
            const stageNames = stages.map((s: any) => s.name);
            if (!stageNames.includes(keyApprovalStage)) {
                return res.status(400).json({
                    success: false,
                    message: 'Key Approval Stage must be one of the defined stages',
                });
            }
        }

        // update workflow
        const updatedWorkflow = await prisma.workflow.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(relatedTo && { relatedTo }),
                ...(keyApprovalStage && { keyApprovalStage }),
            },
        });

        // update stages jika ada
        if (stages && Array.isArray(stages)) {
            // delete existing stages
            await prisma.workflowStage.deleteMany({
                where: { workflowId: id },
            });

            // create new stages
            await prisma.workflowStage.createMany({
                data: stages.map((stage: any, index: number) => ({
                    workflowId: id,
                    name: stage.name,
                    order: stage.order !== undefined ? stage.order : index,
                    highlightColor: stage.highlightColor || '#E91E63',
                    rolesAllowed: stage.rolesAllowed || [],
                })),
            });
        }

        // get updated workflow
        const result = await prisma.workflow.findUnique({
            where: { id },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Workflow updated successfully',
            data: result,
        });
    } catch (error) {
        console.error('Update workflow error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update workflow',
        });
    }
}
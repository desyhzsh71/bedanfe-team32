import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// delete workflow
export async function deleteWorkflow(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

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

        // delete workflow
        await prisma.workflow.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Workflow deleted successfully',
        });
    } catch (error) {
        console.error('Delete workflow error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete workflow',
        });
    }
}
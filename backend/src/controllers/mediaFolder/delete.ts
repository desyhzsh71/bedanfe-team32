import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const deleteFolder = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId, id } = req.params;

        const folder = await prisma.mediaFolder.findUnique({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: {
                        assets: {
                            where: { deletedAt: null },
                        },
                        subfolders: {
                            where: { deletedAt: null },
                        },
                    },
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

        if (!folder || folder.organizationId !== organizationId) {
            return res.status(404).json({
                success: false,
                message: 'Folder not found',
            });
        }

        const isOwner = folder.organization.ownerId === userId;
        const isMember = folder.organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this folder',
            });
        }

        // mengecek apakah folder kosong
        if (folder._count.assets > 0 || folder._count.subfolders > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete folder that contains assets or subfolders',
            });
        }

        await prisma.mediaFolder.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Folder deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting folder:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete folder',
            error: error.message,
        });
    }
};
import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getFolderById = async (req: Request, res: Response) => {
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
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
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

        return res.status(200).json({
            success: true,
            message: 'Folder retrieved successfully',
            data: folder,
        });
    } catch (error: any) {
        console.error('Error getting folder:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve folder',
            error: error.message,
        });
    }
};
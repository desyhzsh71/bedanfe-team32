import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getMediaAssetById = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId, id } = req.params;

        const asset = await prisma.mediaAsset.findUnique({
            where: { id, deletedAt: null },
            include: {
                folder: true,
                uploadedBy: {
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

        if (!asset || asset.organizationId !== organizationId) {
            return res.status(404).json({
                success: false,
                message: 'Media asset not found',
            });
        }

        const isOwner = asset.organization.ownerId === userId;
        const isMember = asset.organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this media asset',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Media asset retrieved successfully',
            data: asset,
        });
    } catch (error: any) {
        console.error('Error getting media asset:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve media asset',
            error: error.message,
        });
    }
};
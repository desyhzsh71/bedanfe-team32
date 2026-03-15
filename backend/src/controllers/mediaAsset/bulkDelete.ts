import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const bulkDeleteMediaAssets = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;
        const { assetIds } = req.body;

        if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Asset IDs array is required',
            });
        }

        // mengecek akses ke organisasi
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

        const isOwner = organization.ownerId === userId;
        const isMember = organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this organization',
            });
        }

        const result = await prisma.mediaAsset.updateMany({
            where: {
                id: { in: assetIds },
                organizationId,
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: `${result.count} media assets deleted successfully`,
            data: {
                deletedCount: result.count,
            },
        });
    } catch (error: any) {
        console.error('Error bulk deleting media assets:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete media assets',
            error: error.message,
        });
    }
};
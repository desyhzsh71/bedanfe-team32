import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getAllMediaAssets = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;
        const { 
            folderId, 
            search, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            page = '1',
            limit = '20'
        } = req.query;

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

        const whereClause: any = {
            organizationId,
            deletedAt: null,
        };

        if (folderId) {
            whereClause.folderId = folderId;
        } else {
            whereClause.folderId = null; // Root level assets
        }

        if (search) {
            whereClause.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
                { tags: { has: search as string } },
            ];
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [assets, totalCount] = await Promise.all([
            prisma.mediaAsset.findMany({
                where: whereClause,
                include: {
                    folder: true,
                    uploadedBy: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    [sortBy as string]: sortOrder,
                },
                skip,
                take: limitNum,
            }),
            prisma.mediaAsset.count({ where: whereClause }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Media assets retrieved successfully',
            data: {
                assets,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount / limitNum),
                },
            },
        });
    } catch (error: any) {
        console.error('Error getting media assets:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve media assets',
            error: error.message,
        });
    }
};
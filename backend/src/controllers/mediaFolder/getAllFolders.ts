import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getAllFolders = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;
        const { parentId, search } = req.query;

        // Cek akses ke organisasi
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

        // Build query filter
        const whereClause: any = {
            organizationId,
            deletedAt: null,
        };

        if (parentId) {
            whereClause.parentId = parentId;
        } else {
            whereClause.parentId = null;
        }

        if (search) {
            whereClause.name = {
                contains: search as string,
                mode: 'insensitive',
            };
        }

        const folders = await prisma.mediaFolder.findMany({
            where: whereClause,
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Folders retrieved successfully',
            data: folders,
        });
    } catch (error: any) {
        console.error('Error getting folders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve folders',
            error: error.message,
        });
    }
};
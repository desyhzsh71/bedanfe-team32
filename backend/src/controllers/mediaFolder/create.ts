import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const createFolder = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;
        const { name, description, parentId, color } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Folder name is required',
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

        if (parentId) {
            const parentFolder = await prisma.mediaFolder.findUnique({
                where: { id: parentId, organizationId, deletedAt: null },
            });

            if (!parentFolder) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent folder not found',
                });
            }
        }

        // mengecek duplikasi nama
        const existingFolder = await prisma.mediaFolder.findFirst({
            where: {
                organizationId,
                parentId: parentId || null,
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
                deletedAt: null,
            },
        });

        if (existingFolder) {
            return res.status(409).json({
                success: false,
                message: 'A folder with this name already exists in this location',
            });
        }

        const folder = await prisma.mediaFolder.create({
            data: {
                organizationId,
                name,
                description: description || null,
                parentId: parentId || null,
                color: color || null,
                createdById: userId!,
            },
            include: {
                _count: {
                    select: {
                        assets: true,
                        subfolders: true,
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
        });

        return res.status(201).json({
            success: true,
            message: 'Folder created successfully',
            data: folder,
        });
    } catch (error: any) {
        console.error('Error creating folder:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create folder',
            error: error.message,
        });
    }
};
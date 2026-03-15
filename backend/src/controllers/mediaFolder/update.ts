import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const updateFolder = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId, id } = req.params;
        const { name, description, parentId, color } = req.body;

        const folder = await prisma.mediaFolder.findUnique({
            where: { id, deletedAt: null },
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

        // validasi jika diubah
        if (parentId && parentId !== folder.parentId) {

            if (parentId === id) {
                return res.status(400).json({
                    success: false,
                    message: 'A folder cannot be its own parent',
                });
            }

            const parentFolder = await prisma.mediaFolder.findUnique({
                where: { id: parentId, organizationId, deletedAt: null },
            });

            if (!parentFolder) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent folder not found',
                });
            }

            const isCircular = await checkCircularReference(id, parentId);
            if (isCircular) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot move folder to its own subfolder',
                });
            }
        }

        // mengecek duplikasi nama jika berubah
        if (name && name !== folder.name) {
            const existingFolder = await prisma.mediaFolder.findFirst({
                where: {
                    organizationId,
                    parentId: parentId !== undefined ? parentId : folder.parentId,
                    name: {
                        equals: name,
                        mode: 'insensitive',
                    },
                    id: { not: id },
                    deletedAt: null,
                },
            });

            if (existingFolder) {
                return res.status(409).json({
                    success: false,
                    message: 'A folder with this name already exists in this location',
                });
            }
        }

        const updatedFolder = await prisma.mediaFolder.update({
            where: { id },
            data: {
                name: name !== undefined ? name : folder.name,
                description: description !== undefined ? description : folder.description,
                parentId: parentId !== undefined ? parentId : folder.parentId,
                color: color !== undefined ? color : folder.color,
            },
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
        });

        return res.status(200).json({
            success: true,
            message: 'Folder updated successfully',
            data: updatedFolder,
        });
    } catch (error: any) {
        console.error('Error updating folder:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update folder',
            error: error.message,
        });
    }
};

// helper function untuk mengecek referensi
async function checkCircularReference(folderId: string, targetParentId: string): Promise<boolean> {
    let currentId = targetParentId;
    
    while (currentId) {
        if (currentId === folderId) {
            return true;
        }
        
        const parent = await prisma.mediaFolder.findUnique({
            where: { id: currentId },
            select: { parentId: true },
        });
        
        if (!parent || !parent.parentId) {
            break;
        }
        
        currentId = parent.parentId;
    }
    
    return false;
}
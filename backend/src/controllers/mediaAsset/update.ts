import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const updateMediaAsset = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId, id } = req.params;
        const { title, description, altText, tags, language, folderId } = req.body;

        const asset = await prisma.mediaAsset.findUnique({
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

        // validasi folder jika diubah
        if (folderId && folderId !== asset.folderId) {
            const folder = await prisma.mediaFolder.findUnique({
                where: { id: folderId, organizationId },
            });

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Target folder not found',
                });
            }
        }

        const updatedAsset = await prisma.mediaAsset.update({
            where: { id },
            data: {
                title: title !== undefined ? title : asset.title,
                description: description !== undefined ? description : asset.description,
                altText: altText !== undefined ? altText : asset.altText,
                tags: tags !== undefined ? tags : asset.tags,
                language: language !== undefined ? language : asset.language,
                folderId: folderId !== undefined ? folderId : asset.folderId,
            },
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
        });

        return res.status(200).json({
            success: true,
            message: 'Media asset updated successfully',
            data: updatedAsset,
        });
    } catch (error: any) {
        console.error('Error updating media asset:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update media asset',
            error: error.message,
        });
    }
};
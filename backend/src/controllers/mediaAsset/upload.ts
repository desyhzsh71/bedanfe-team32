import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { uploadToCloudStorage } from '../../utils/cloudStorage';

export const uploadMediaAsset = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;
        const { folderId, title, description, altText, tags, language } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded',
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

        // validasi folder jika ada
        if (folderId) {
            const folder = await prisma.mediaFolder.findUnique({
                where: { id: folderId, organizationId },
            });

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Folder not found',
                });
            }
        }

        // upload files dan create records
        const uploadedAssets = await Promise.all(
            files.map(async (file, index) => {
                // upload ke cloud storage
                const uploadResult = await uploadToCloudStorage(file, organizationId);

                let parsedTags: string[] = [];
                if (tags) {
                    parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
                }

                return prisma.mediaAsset.create({
                    data: {
                        organizationId,
                        folderId: folderId || null,
                        uploadedById: userId!,
                        title: title || file.originalname,
                        description: description || null,
                        altText: altText || null,
                        fileName: file.originalname,
                        fileUrl: uploadResult.url,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        extension: file.originalname.split('.').pop() || '',
                        width: uploadResult.width || null,
                        height: uploadResult.height || null,
                        duration: uploadResult.duration || null,
                        tags: parsedTags,
                        language: language || 'en',
                    },
                    include: {
                        uploadedBy: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                });
            })
        );

        return res.status(201).json({
            success: true,
            message: 'Media assets uploaded successfully',
            data: uploadedAssets,
        });
    } catch (error: any) {
        console.error('Error uploading media assets:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload media assets',
            error: error.message,
        });
    }
};
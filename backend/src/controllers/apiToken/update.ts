import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// update api token
export async function updateApiToken(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, description, validityPeriod,
            accessScope, permissions, status,
        } = req.body;

        const token = await prisma.apiToken.findUnique({
            where: { id },
            include: {
                organization: {
                    include: {
                        members: {
                            where: { userId, status: 'ACTIVE' },
                        },
                    },
                },
                permissions: true,
            },
        });

        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'API Token not found',
            });
        }

        // mengecek akses -> hanya owner dan member aktif yang boleh
        const isOwner = token.organization.ownerId === userId;
        const isMember = token.organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this API token',
            });
        }

        // mengecek apakah nama yang akan diubah sudah ada atau tidak
        if (name && name !== token.name) {
            const existingToken = await prisma.apiToken.findUnique({
                where: {
                    organizationId_name: {
                        organizationId: token.organizationId,
                        name,
                    },
                },
            });

            if (existingToken) {
                return res.status(400).json({
                    success: false,
                    message: 'API Token with this name already exists',
                });
            }
        }

        // menghitung tanggal kedaluwarsa baru jika periode validitasnya berubah
        let newExpiresAt = token.expiresAt;
        if (validityPeriod && validityPeriod !== token.validityPeriod) {
            newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + validityPeriod);
        }

        // update token
        const updatedToken = await prisma.apiToken.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(validityPeriod && { validityPeriod, expiresAt: newExpiresAt }),
                ...(accessScope && { accessScope }),
                ...(status && { status }),
            },
        });

        // memperbarui izin jika aksesnya CUSTOM
        if (accessScope === 'CUSTOM' && permissions && Array.isArray(permissions)) {
            // delete existing permissions
            await prisma.apiTokenPermission.deleteMany({
                where: { apiTokenId: id },
            });

            // create new permissions
            const permissionData = permissions.map((perm: any) => ({
                apiTokenId: id,
                resource: perm.resource,
                action: perm.action,
            }));

            await prisma.apiTokenPermission.createMany({
                data: permissionData,
            });
        }

        // get updated token with permissions
        const result = await prisma.apiToken.findUnique({
            where: { id },
            include: {
                permissions: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'API Token updated successfully',
            data: {
                id: result!.id,
                name: result!.name,
                description: result!.description,
                tokenPrefix: result!.tokenPrefix,
                validityPeriod: result!.validityPeriod,
                accessScope: result!.accessScope,
                status: result!.status,
                createdAt: result!.createdAt,
                expiresAt: result!.expiresAt,
                lastUsedAt: result!.lastUsedAt,
                permissions: result!.permissions,
            },
        });
    } catch (error) {
        console.error('Update API token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update API token',
        });
    }
}

// revoke API Token -> status menjadi dicabut/REVOKED
export async function revokeApiToken(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const token = await prisma.apiToken.findUnique({
            where: { id },
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

        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'API Token not found',
            });
        }

        // mengecek akses
        const isOwner = token.organization.ownerId === userId;
        const isMember = token.organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this API token',
            });
        }

        // revoke token
        await prisma.apiToken.update({
            where: { id },
            data: {
                status: 'REVOKED',
            },
        });

        res.status(200).json({
            success: true,
            message: 'API Token revoked successfully',
        });
    } catch (error) {
        console.error('Revoke API token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke API token',
        });
    }
}
import { Request, Response } from "express";
import { AccessScope } from "../../generated";
import prisma from "../../utils/prisma";
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// create api token
export async function createApiToken(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { organizationId, name, description,
            validityPeriod, accessScope, permissions,
        } = req.body;

        if (!name || !validityPeriod || !accessScope) {
            return res.status(400).json({
                success: false,
                message: 'Name, validity period, and access scope are required',
            });
        }

        // validasi akses organisasi
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

        // mengecek akses -> hanya owner dan member aktif yang boleh
        const isOwner = organization.ownerId === userId;
        const isMember = organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this organization',
            });
        }

        // mengecek apakah nama token sudah ada di organisasi ini atau tidak
        const existingToken = await prisma.apiToken.findUnique({
            where: {
                organizationId_name: {
                    organizationId,
                    name,
                },
            },
        });

        if (existingToken) {
            return res.status(400).json({
                success: false,
                message: 'API Token with this name already exists in your organization',
            });
        }

        // generate token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenPrefix = rawToken.substring(0, 8); // first 8 chars for display
        const hashedToken = await bcrypt.hash(rawToken, 10);

        // menghitung tanggal kedaluwarsa
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + validityPeriod);

        // create API Token
        const apiToken = await prisma.apiToken.create({
            data: {
                organizationId,
                name,
                description: description || null,
                token: hashedToken,
                tokenPrefix,
                validityPeriod,
                accessScope: accessScope as AccessScope,
                expiresAt,
                status: 'ACTIVE',
            },
        });

        // membuat izin jika aksesnya CUSTOM
        if (accessScope === 'CUSTOM' && permissions && Array.isArray(permissions)) {
            const permissionData = permissions.map((perm: any) => ({
                apiTokenId: apiToken.id,
                resource: perm.resource,
                action: perm.action,
            }));

            await prisma.apiTokenPermission.createMany({
                data: permissionData,
            });
        }

        // get token yang sudah dibuat
        const createdToken = await prisma.apiToken.findUnique({
            where: { id: apiToken.id },
            include: {
                permissions: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'API Token created successfully',
            data: {
                ...createdToken,
                rawToken, // cuma diperlihatkan sekali
            },
            warning: 'Please save this token securely. It will not be shown again',
        });
    } catch (error) {
        console.error('Create API token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create API token',
        });
    }
}
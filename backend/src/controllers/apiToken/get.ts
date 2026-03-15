import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// get all token API beradasarkan id organisasi
export async function getAllApiTokens(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;

        // validate organization access
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                members: {
                    where: {
                        userId,
                        status: 'ACTIVE',
                    },
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

        // get all tokens
        const tokens = await prisma.apiToken.findMany({
            where: { organizationId },
            include: {
                permissions: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // hide token sebenarnya, hanya tampil yang prefix
        const tokensWithoutSecret = tokens.map((token) => ({
            id: token.id,
            name: token.name,
            description: token.description,
            tokenPrefix: token.tokenPrefix,
            validityPeriod: token.validityPeriod,
            accessScope: token.accessScope,
            status: token.status,
            createdAt: token.createdAt,
            expiresAt: token.expiresAt,
            lastUsedAt: token.lastUsedAt,
            permissions: token.permissions,
        }));

        res.status(200).json({
            success: true,
            data: tokensWithoutSecret,
        });
    } catch (error) {
        console.error('Get all API tokens error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch API tokens',
        });
    }
}

// get single API token berdasarkan ID
export async function getApiTokenById(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const token = await prisma.apiToken.findUnique({
            where: { id },
            include: {
                permissions: true,
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

        // hide token yang sebenarnya
        const tokenData = {
            id: token.id,
            name: token.name,
            description: token.description,
            tokenPrefix: token.tokenPrefix,
            validityPeriod: token.validityPeriod,
            accessScope: token.accessScope,
            status: token.status,
            createdAt: token.createdAt,
            expiresAt: token.expiresAt,
            lastUsedAt: token.lastUsedAt,
            permissions: token.permissions,
        };

        res.status(200).json({
            success: true,
            data: tokenData,
        });
    } catch (error) {
        console.error('Get API token by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch API token',
        });
    }
}

// get usage logs untuk token
export async function getApiTokenUsageLogs(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { limit = 100, offset = 0 } = req.query;

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

        // get usage logs
        const logs = await prisma.apiTokenUsageLog.findMany({
            where: { apiTokenId: id },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
        });

        const totalLogs = await prisma.apiTokenUsageLog.count({
            where: { apiTokenId: id },
        });

        res.status(200).json({
            success: true,
            data: {
                logs,
                pagination: {
                    total: totalLogs,
                    limit: Number(limit),
                    offset: Number(offset),
                },
            },
        });
    } catch (error) {
        console.error('Get API token usage logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch usage logs',
        });
    }
}
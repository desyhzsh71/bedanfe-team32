import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// delete api token
export const deleteApiToken = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // mencari token beserta organisasi dan members
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

        // mengecek akses -> hanya owner dan member aktif yang boleh
        const isOwner = token.organization.ownerId === userId;
        const isMember = token.organization.members.length > 0;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this API token',
            });
        }


        await prisma.apiToken.delete({
            where: { id },
        });

        return res.status(200).json({
            success: true,
            message: 'API Token deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting API token:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete API token',
            error: error.message,
        });
    }
};
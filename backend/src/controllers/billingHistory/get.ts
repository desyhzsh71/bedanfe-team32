import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getBillingHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;
        const { page = '1', limit = '10', status } = req.query;

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
            subscription: {
                organizationId,
            },
        };

        if (status) {
            whereClause.status = status;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [billingHistories, totalCount] = await Promise.all([
            prisma.billingHistory.findMany({
                where: whereClause,
                include: {
                    subscription: {
                        include: {
                            plan: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limitNum,
            }),
            prisma.billingHistory.count({ where: whereClause }),
        ]);

        return res.status(200).json({
            success: true,
            message: 'Billing history retrieved successfully',
            data: {
                billingHistories: billingHistories.map(history => ({
                    id: history.id,
                    planName: history.subscription.plan.name,
                    amount: history.amount.toString(),
                    status: history.status,
                    invoiceNumber: history.invoiceNumber,
                    invoiceUrl: history.invoiceUrl,
                    createdAt: history.createdAt,
                    updatedAt: history.updatedAt,
                })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount / limitNum),
                },
            },
        });
    } catch (error: any) {
        console.error('Error getting billing history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve billing history',
            error: error.message,
        });
    }
};
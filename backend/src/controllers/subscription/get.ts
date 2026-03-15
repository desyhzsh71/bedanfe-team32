import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getCurrentSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;

        // mengecek akses ke organization
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

        // get active subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
            include: {
                plan: true,
                usageTracking: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found',
            });
        }

        // get current usage
        const currentUsage = subscription.usageTracking[0] || null;
        const planLimits = subscription.plan.limits as any;

        // menghitung presentasi penggunaan
        const usagePercentage = currentUsage ? {
            bandwidth: planLimits.bandwidth ? (currentUsage.bandwidthUsed / planLimits.bandwidth) * 100 : 0,
            apiCalls: planLimits.apiCalls ? (currentUsage.apiCallsUsed / planLimits.apiCalls) * 100 : 0,
            mediaAssets: planLimits.mediaAssets ? (currentUsage.mediaAssetsUsed / planLimits.mediaAssets) * 100 : 0,
            projects: planLimits.projects ? (currentUsage.projectsUsed / planLimits.projects) * 100 : 0,
        } : null;

        return res.status(200).json({
            success: true,
            message: 'Current subscription retrieved successfully',
            data: {
                subscription: {
                    ...subscription,
                    plan: {
                        ...subscription.plan,
                        price: subscription.plan.price.toString(),
                        features: subscription.plan.features as any,
                        limits: planLimits,
                    },
                },
                currentUsage,
                usagePercentage,
                usageTracking: undefined,
            },
        });
    } catch (error: any) {
        console.error('Error getting current subscription:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription',
            error: error.message,
        });
    }
};
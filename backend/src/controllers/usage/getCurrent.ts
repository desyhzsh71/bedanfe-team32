import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getCurrentUsage = async (req: Request, res: Response) => {
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

        const currentUsage = subscription.usageTracking[0];
        const planLimits = subscription.plan.limits as any;

        // menghitung persentase dan peringatan
        const usageData = {
            bandwidth: {
                used: currentUsage.bandwidthUsed,
                limit: planLimits.bandwidth || 'unlimited',
                percentage: planLimits.bandwidth ? (currentUsage.bandwidthUsed / planLimits.bandwidth) * 100 : 0,
                warning: planLimits.bandwidth && currentUsage.bandwidthUsed >= planLimits.bandwidth * 0.8,
            },
            apiCalls: {
                used: currentUsage.apiCallsUsed,
                limit: planLimits.apiCalls || 'unlimited',
                percentage: planLimits.apiCalls ? (currentUsage.apiCallsUsed / planLimits.apiCalls) * 100 : 0,
                warning: planLimits.apiCalls && currentUsage.apiCallsUsed >= planLimits.apiCalls * 0.8,
            },
            mediaAssets: {
                used: currentUsage.mediaAssetsUsed,
                limit: planLimits.mediaAssets || 'unlimited',
                percentage: planLimits.mediaAssets ? (currentUsage.mediaAssetsUsed / planLimits.mediaAssets) * 100 : 0,
                warning: planLimits.mediaAssets && currentUsage.mediaAssetsUsed >= planLimits.mediaAssets * 0.8,
            },
            projects: {
                used: currentUsage.projectsUsed,
                limit: planLimits.projects || 'unlimited',
                percentage: planLimits.projects ? (currentUsage.projectsUsed / planLimits.projects) * 100 : 0,
                warning: planLimits.projects && currentUsage.projectsUsed >= planLimits.projects * 0.8,
            },
            collaborators: {
                used: currentUsage.collaboratorsUsed,
                limit: planLimits.collaborators || 'unlimited',
                percentage: planLimits.collaborators ? (currentUsage.collaboratorsUsed / planLimits.collaborators) * 100 : 0,
                warning: planLimits.collaborators && currentUsage.collaboratorsUsed >= planLimits.collaborators * 0.8,
            },
        };

        return res.status(200).json({
            success: true,
            message: 'Current usage retrieved successfully',
            data: {
                subscription: {
                    id: subscription.id,
                    planName: subscription.plan.name,
                    status: subscription.status,
                },
                period: {
                    start: currentUsage.periodStart,
                    end: currentUsage.periodEnd,
                },
                usage: usageData,
                hasWarnings: Object.values(usageData).some((item: any) => item.warning),
            },
        });
    } catch (error: any) {
        console.error('Error getting current usage:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage data',
            error: error.message,
        });
    }
};
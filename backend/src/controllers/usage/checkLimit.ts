 import prisma from '../../utils/prisma';

// helper untuk mengecek apakah sudah exceed limit
export const checkUsageLimit = async (
    organizationId: string,
    usageType: 'bandwidth' | 'apiCalls' | 'mediaAssets' | 'projects' | 'collaborators' | 'webhooks' | 'models' | 'locales' | 'records'
): Promise<{ allowed: boolean; used: number; limit: number | 'unlimited'; percentage: number }> => {
    try {
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

        if (!subscription || !subscription.usageTracking[0]) {
            return { allowed: false, used: 0, limit: 0, percentage: 0 };
        }

        const currentUsage = subscription.usageTracking[0];
        const planLimits = subscription.plan.limits as any;

        const limitKey = usageType.replace('Used', '');
        const limit = planLimits[limitKey];

        // jika unlimited, selalu di-allowed
        if (!limit || limit === -1 || limit === 'unlimited') {
            return { allowed: true, used: currentUsage[`${usageType}Used`] || 0, limit: 'unlimited', percentage: 0 };
        }

        const used = currentUsage[`${usageType}Used`] || 0;
        const percentage = (used / limit) * 100;

        return {
            allowed: used < limit,
            used,
            limit,
            percentage,
        };
    } catch (error) {
        console.error('Error checking usage limit:', error);
        return { allowed: false, used: 0, limit: 0, percentage: 0 };
    }
};
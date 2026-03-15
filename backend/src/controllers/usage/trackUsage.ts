import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

// function internal untuk melacak penggunaan
export const trackUsage = async (
    organizationId: string,
    usageType: 'bandwidth' | 'apiCalls' | 'mediaAssets' | 'projects' | 'collaborators' | 'webhooks' | 'models' | 'locales' | 'records',
    amount: number = 1
) => {
    try {
        // get active subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
            include: {
                usageTracking: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        if (!subscription || !subscription.usageTracking[0]) {
            console.warn(`No active subscription or usage tracking for organization: ${organizationId}`);
            return;
        }

        const currentUsage = subscription.usageTracking[0];

        // update usage berdasarkan tipe
        const updateData: any = {};
        switch (usageType) {
            case 'bandwidth':
                updateData.bandwidthUsed = currentUsage.bandwidthUsed + amount;
                break;
            case 'apiCalls':
                updateData.apiCallsUsed = currentUsage.apiCallsUsed + amount;
                break;
            case 'mediaAssets':
                updateData.mediaAssetsUsed = currentUsage.mediaAssetsUsed + amount;
                break;
            case 'projects':
                updateData.projectsUsed = currentUsage.projectsUsed + amount;
                break;
            case 'collaborators':
                updateData.collaboratorsUsed = currentUsage.collaboratorsUsed + amount;
                break;
            case 'webhooks':
                updateData.webhooksUsed = currentUsage.webhooksUsed + amount;
                break;
            case 'models':
                updateData.modelsUsed = currentUsage.modelsUsed + amount;
                break;
            case 'locales':
                updateData.localesUsed = currentUsage.localesUsed + amount;
                break;
            case 'records':
                updateData.recordsUsed = currentUsage.recordsUsed + amount;
                break;
        }

        await prisma.usageTracking.update({
            where: { id: currentUsage.id },
            data: updateData,
        });

        console.log(`Usage tracked: ${usageType} +${amount} for organization ${organizationId}`);
    } catch (error) {
        console.error('Error tracking usage:', error);
    }
};
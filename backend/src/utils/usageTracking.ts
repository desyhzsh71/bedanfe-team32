import prisma from "./prisma";

export const incrementProjectUsage = async (organizationId: string) => {
    try {
        // get active subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) {
            console.log('No active subscription found for org:', organizationId);
            return;
        }

        // get or create usage tracking
        let usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (!usage) {
            usage = await prisma.usageTracking.create({
                data: {
                    subscriptionId: subscription.id,
                    periodStart: new Date(),
                    periodEnd: new Date('2099-12-31'),
                    projectsUsed: 1,
                    collaboratorsUsed: 0,
                    mediaAssetsUsed: 0,
                    bandwidthUsed: 0,
                    apiCallsUsed: 0,
                    webhooksUsed: 0,
                    modelsUsed: 0,
                    localesUsed: 0,
                    recordsUsed: 0,
                },
            });
            console.log('Created usage tracking with 1 project');
        } else {
            usage = await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    projectsUsed: { increment: 1 },
                },
            });
            console.log('Incremented project usage:', usage.projectsUsed);
        }

        return usage;
    } catch (error) {
        console.error('Error incrementing project usage:', error);
    }
};

export const decrementProjectUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        const usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (usage && usage.projectsUsed > 0) {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    projectsUsed: { decrement: 1 },
                },
            });
            console.log('Decremented project usage');
        }
    } catch (error) {
        console.error('Error decrementing project usage:', error);
    }
};

export const incrementCollaboratorUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        let usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (!usage) {
            usage = await prisma.usageTracking.create({
                data: {
                    subscriptionId: subscription.id,
                    periodStart: new Date(),
                    periodEnd: new Date('2099-12-31'),
                    projectsUsed: 0,
                    collaboratorsUsed: 1,
                    mediaAssetsUsed: 0,
                    bandwidthUsed: 0,
                    apiCallsUsed: 0,
                    webhooksUsed: 0,
                    modelsUsed: 0,
                    localesUsed: 0,
                    recordsUsed: 0,
                },
            });
        } else {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    collaboratorsUsed: { increment: 1 },
                },
            });
        }

        console.log('Incremented collaborator usage');
    } catch (error) {
        console.error('Error incrementing collaborator usage:', error);
    }
};

export const decrementCollaboratorUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        const usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (usage && usage.collaboratorsUsed > 0) {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    collaboratorsUsed: { decrement: 1 },
                },
            });
            console.log('Decremented collaborator usage');
        }
    } catch (error) {
        console.error('Error decrementing collaborator usage:', error);
    }
};

export const incrementMediaAssetUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        let usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (!usage) {
            usage = await prisma.usageTracking.create({
                data: {
                    subscriptionId: subscription.id,
                    periodStart: new Date(),
                    periodEnd: new Date('2099-12-31'),
                    projectsUsed: 0,
                    collaboratorsUsed: 0,
                    mediaAssetsUsed: 1, // ✅ Correct field name
                    bandwidthUsed: 0,
                    apiCallsUsed: 0,
                    webhooksUsed: 0,
                    modelsUsed: 0,
                    localesUsed: 0,
                    recordsUsed: 0,
                },
            });
        } else {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    mediaAssetsUsed: { increment: 1 },
                },
            });
        }

        console.log('Incremented media asset usage');
    } catch (error) {
        console.error('Error incrementing media asset usage:', error);
    }
};

export const decrementMediaAssetUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        const usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (usage && usage.mediaAssetsUsed > 0) {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    mediaAssetsUsed: { decrement: 1 },
                },
            });
            console.log('Decremented media asset usage');
        }
    } catch (error) {
        console.error('Error decrementing media asset usage:', error);
    }
};

export const incrementApiCallUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        let usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (!usage) {
            usage = await prisma.usageTracking.create({
                data: {
                    subscriptionId: subscription.id,
                    periodStart: new Date(),
                    periodEnd: new Date('2099-12-31'),
                    projectsUsed: 0,
                    collaboratorsUsed: 0,
                    mediaAssetsUsed: 0,
                    bandwidthUsed: 0,
                    apiCallsUsed: 1,
                    webhooksUsed: 0,
                    modelsUsed: 0,
                    localesUsed: 0,
                    recordsUsed: 0,
                },
            });
        } else {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    apiCallsUsed: { increment: 1 },
                },
            });
        }
    } catch (error) {
        console.error('Error incrementing API call usage:', error);
    }
};

export const incrementWebhookUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        let usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (!usage) {
            usage = await prisma.usageTracking.create({
                data: {
                    subscriptionId: subscription.id,
                    periodStart: new Date(),
                    periodEnd: new Date('2099-12-31'),
                    projectsUsed: 0,
                    collaboratorsUsed: 0,
                    mediaAssetsUsed: 0,
                    bandwidthUsed: 0,
                    apiCallsUsed: 0,
                    webhooksUsed: 1, // ✅ Correct field name
                    modelsUsed: 0,
                    localesUsed: 0,
                    recordsUsed: 0,
                },
            });
        } else {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    webhooksUsed: { increment: 1 },
                },
            });
        }

        console.log('Incremented webhook usage');
    } catch (error) {
        console.error('Error incrementing webhook usage:', error);
    }
};

export const decrementWebhookUsage = async (organizationId: string) => {
    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (!subscription) return;

        const usage = await prisma.usageTracking.findFirst({
            where: {
                subscriptionId: subscription.id,
            },
        });

        if (usage && usage.webhooksUsed > 0) {
            await prisma.usageTracking.update({
                where: { id: usage.id },
                data: {
                    webhooksUsed: { decrement: 1 },
                },
            });
            console.log('Decremented webhook usage');
        }
    } catch (error) {
        console.error('Error decrementing webhook usage:', error);
    }
};
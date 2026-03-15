import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const cancelSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;

        // Cek organization ownership
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        if (organization.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only organization owner can cancel subscription',
            });
        }

        // Get current subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
            include: {
                plan: true,
            },
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found',
            });
        }

        // Update subscription status
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELLED',
                autoRenew: false,
            },
            include: {
                plan: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully. You can still use the service until the end of billing period.',
            data: {
                ...updatedSubscription,
                plan: {
                    ...updatedSubscription.plan,
                    price: updatedSubscription.plan.price.toString(),
                },
            },
        });
    } catch (error: any) {
        console.error('Error cancelling subscription:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription',
            error: error.message,
        });
    }
};
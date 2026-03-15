import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { createMidtransTransaction } from '../../utils/midtrans';

export const upgradeSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId } = req.params;
        const { newPlanId } = req.body;

        if (!newPlanId) {
            return res.status(400).json({
                success: false,
                message: 'New plan ID is required',
            });
        }

        // mengecek owner organisasi
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
                message: 'Only organization owner can upgrade subscription',
            });
        }

        // get current subscription
        const currentSubscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
            include: {
                plan: true,
            },
        });

        if (!currentSubscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found',
            });
        }

        // get new plan
        const newPlan = await prisma.plan.findUnique({
            where: { id: newPlanId },
        });

        if (!newPlan || !newPlan.isActive) {
            return res.status(404).json({
                success: false,
                message: 'New plan not found or inactive',
            });
        }

        // validasi upgrade (tidak bisa mengubah versi ke gratis atau plan lebih murah)
        if (newPlan.price.lte(currentSubscription.plan.price)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot downgrade to a lower or same price plan. Please cancel current subscription first.',
            });
        }

        const amount = newPlan.price.toNumber();

        // get billing address
        const billingAddress = await prisma.billingAddress.findUnique({
            where: { userId: userId! },
        });

        // create transaksi midtrans untuk upgrade
        const midtransResponse = await createMidtransTransaction({
            orderId: `UPG-${currentSubscription.id}-${Date.now()}`,
            amount,
            customerDetails: {
                firstName: billingAddress?.fullName || organization.name,
                email: billingAddress?.email || '',
                phone: '08123456789',
            },
            itemDetails: [{
                id: newPlan.id,
                name: `Upgrade to ${newPlan.name}`,
                price: amount,
                quantity: 1,
            }],
        });

        // create payment transaction
        await prisma.paymentTransaction.create({
            data: {
                subscriptionId: currentSubscription.id,
                paymentGateway: 'MIDTRANS',
                transactionId: midtransResponse.transaction_id,
                amount: newPlan.price,
                status: 'PENDING',
                redirectUrl: midtransResponse.redirect_url,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Upgrade initiated. Please complete payment.',
            data: {
                currentPlan: {
                    ...currentSubscription.plan,
                    price: currentSubscription.plan.price.toString(),
                },
                newPlan: {
                    ...newPlan,
                    price: newPlan.price.toString(),
                },
                paymentUrl: midtransResponse.redirect_url,
                transactionId: midtransResponse.transaction_id,
            },
        });
    } catch (error: any) {
        console.error('Error upgrading subscription:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upgrade subscription',
            error: error.message,
        });
    }
};
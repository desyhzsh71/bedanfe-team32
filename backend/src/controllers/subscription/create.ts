import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { createMidtransTransaction } from '../../utils/midtrans';
import { addMonths, addYears } from 'date-fns';

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { organizationId, planId, billingCycle } = req.body;

        if (!organizationId || !planId) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID and Plan ID are required',
            });
        }

        // mengecek akses ke organization -> hanya owner
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
                message: 'Only organization owner can manage subscription',
            });
        }

        // mengecek apakah sudah punya subscription aktif atau tidak
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
        });

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'Organization already has an active subscription. Please upgrade or cancel first.',
            });
        }

        // get plan details
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
        });

        if (!plan || !plan.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found or inactive',
            });
        }

        // untuk FREE plan, langsung aktivasi tanpa payment
        if (plan.price.toNumber() === 0) {
            const subscription = await prisma.subscription.create({
                data: {
                    organizationId,
                    planId,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: null, // free plan tidak ada end date
                    autoRenew: true,
                },
                include: {
                    plan: true,
                },
            });

            // create usage tracking
            await prisma.usageTracking.create({
                data: {
                    subscriptionId: subscription.id,
                    periodStart: new Date(),
                    periodEnd: addMonths(new Date(), 1), // Reset monthly
                },
            });

            return res.status(201).json({
                success: true,
                message: 'Free plan activated successfully',
                data: {
                    ...subscription,
                    plan: {
                        ...subscription.plan,
                        price: subscription.plan.price.toString(),
                    },
                },
            });
        }

        // untuk plan berbayar, create pending subscription dulu
        const endDate = billingCycle === 'YEARLY' 
            ? addYears(new Date(), 1) 
            : addMonths(new Date(), 1);

        const subscription = await prisma.subscription.create({
            data: {
                organizationId,
                planId,
                status: 'PENDING', // pending sampai payment sukses
                startDate: new Date(),
                endDate,
                nextPaymentDate: endDate,
                autoRenew: true,
            },
            include: {
                plan: true,
                organization: true,
            },
        });

        // get billing address jika ada
        const billingAddress = await prisma.billingAddress.findUnique({
            where: { userId: userId! },
        });

        // create midtrans transaction
        const amount = plan.price.toNumber();
        const midtransResponse = await createMidtransTransaction({
            orderId: subscription.id,
            amount,
            customerDetails: {
                firstName: billingAddress?.fullName || organization.name,
                email: billingAddress?.email || '',
                phone: '',
            },
            itemDetails: [{
                id: plan.id,
                name: `${plan.name} - ${billingCycle}`,
                price: amount,
                quantity: 1,
            }],
        });

        // menyimpan transaksi pembayaran
        await prisma.paymentTransaction.create({
            data: {
                subscriptionId: subscription.id,
                paymentGateway: 'MIDTRANS',
                transactionId: midtransResponse.transaction_id,
                amount: plan.price,
                status: 'PENDING',
                redirectUrl: midtransResponse.redirect_url,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Subscription created. Please complete payment.',
            data: {
                subscription: {
                    ...subscription,
                    plan: {
                        ...subscription.plan,
                        price: subscription.plan.price.toString(),
                    },
                },
                paymentUrl: midtransResponse.redirect_url,
                transactionId: midtransResponse.transaction_id,
            },
        });
    } catch (error: any) {
        console.error('Error creating subscription:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create subscription',
            error: error.message,
        });
    }
};
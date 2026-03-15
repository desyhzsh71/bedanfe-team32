import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const comparePlans = async (req: Request, res: Response) => {
    try {
        const { planIds } = req.query;

        if (!planIds || typeof planIds !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Plan IDs are required (comma-separated)',
            });
        }

        const ids = planIds.split(',').map(id => id.trim());

        const plans = await prisma.plan.findMany({
            where: {
                id: { in: ids },
                isActive: true,
            },
            orderBy: {
                price: 'asc',
            },
        });

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No plans found',
            });
        }

        const parsedPlans = plans.map(plan => ({
            ...plan,
            features: plan.features as any,
            limits: plan.limits as any,
            price: plan.price.toString(),
        }));

        return res.status(200).json({
            success: true,
            message: 'Plans comparison retrieved successfully',
            data: parsedPlans,
        });
    } catch (error: any) {
        console.error('Error comparing plans:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to compare plans',
            error: error.message,
        });
    }
};
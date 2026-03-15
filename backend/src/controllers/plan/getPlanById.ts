import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getPlanById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const plan = await prisma.plan.findUnique({
            where: { id },
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Plan retrieved successfully',
            data: {
                ...plan,
                features: plan.features as any,
                limits: plan.limits as any,
                price: plan.price.toString(),
            },
        });
    } catch (error: any) {
        console.error('Error getting plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve plan',
            error: error.message,
        });
    }
};
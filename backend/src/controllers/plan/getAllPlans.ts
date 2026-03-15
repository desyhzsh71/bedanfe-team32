import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getAllPlans = async (req: Request, res: Response) => {
    try {
        const { isActive } = req.query;

        const whereClause: any = {};
        
        if (isActive === 'true') {
            whereClause.isActive = true;
        }

        const plans = await prisma.plan.findMany({
            where: whereClause,
            orderBy: {
                price: 'asc', // urutkan dari yang gratis sampai termahal
            },
        });

        const parsedPlans = plans.map(plan => ({
            ...plan,
            features: plan.features as any,
            limits: plan.limits as any,
            price: plan.price.toString(), // mengubah desimal ke string
        }));

        return res.status(200).json({
            success: true,
            message: 'Plans retrieved successfully',
            data: parsedPlans,
        });
    } catch (error: any) {
        console.error('Error getting plans:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve plans',
            error: error.message,
        });
    }
};
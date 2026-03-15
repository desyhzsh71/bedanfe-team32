import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getAllPaymentMethods = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        const paymentMethods = await prisma.paymentMethod.findMany({
            where: { 
                userId: userId!,
                isActive: true,
            },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        return res.status(200).json({
            success: true,
            message: 'Payment methods retrieved successfully',
            data: paymentMethods,
        });
    } catch (error: any) {
        console.error('Error getting payment methods:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment methods',
            error: error.message,
        });
    }
};
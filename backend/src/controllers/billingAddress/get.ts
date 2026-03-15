import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const getBillingAddress = async (req: Request, res: Response) => {
    try {
        // TEMPORARY TEST - tanpa authMiddleware
        // const userId = req.user?.id;

        // Hard-code user ID untuk testing
        const userId = 2; // pastikan ini ID user yang ADA di database

        const billingAddress = await prisma.billingAddress.findUnique({
            where: { userId },
        });

        if (!billingAddress) {
            return res.status(404).json({
                success: false,
                message: 'Billing address not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Billing address retrieved successfully',
            data: billingAddress,
        });
    } catch (error: any) {
        console.error('Error getting billing address:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve billing address',
            error: error.message,
        });
    }
};
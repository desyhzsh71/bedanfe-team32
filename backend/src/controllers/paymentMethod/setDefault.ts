import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // mengecek apakah payment method milik user atau tidak
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!paymentMethod || paymentMethod.userId !== userId) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found',
            });
        }

        // unset default dari semua payment methods user
        await prisma.paymentMethod.updateMany({
            where: { userId: userId!, isDefault: true },
            data: { isDefault: false },
        });

        // set payment method ini sebagai default
        const updatedPaymentMethod = await prisma.paymentMethod.update({
            where: { id },
            data: { isDefault: true },
        });

        return res.status(200).json({
            success: true,
            message: 'Payment method set as default successfully',
            data: updatedPaymentMethod,
        });
    } catch (error: any) {
        console.error('Error setting default payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to set default payment method',
            error: error.message,
        });
    }
};
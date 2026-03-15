import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const deletePaymentMethod = async (req: Request, res: Response) => {
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

        // soft delete
        const deletedPaymentMethod = await prisma.paymentMethod.update({
            where: { id },
            data: { 
                isActive: false,
                isDefault: false,
            },
        });
        
        if (paymentMethod.isDefault) {
            const otherMethod = await prisma.paymentMethod.findFirst({
                where: {
                    userId: userId!,
                    isActive: true,
                    id: { not: id },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            if (otherMethod) {
                await prisma.paymentMethod.update({
                    where: { id: otherMethod.id },
                    data: { isDefault: true },
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Payment method deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete payment method',
            error: error.message,
        });
    }
};
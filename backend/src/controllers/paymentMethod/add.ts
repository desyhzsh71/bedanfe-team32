import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const addPaymentMethod = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { 
            type, 
            cardLastFour, 
            cardBrand, 
            walletProvider, 
            walletPhone,
            isDefault 
        } = req.body;

        // validasi
        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Payment type is required',
            });
        }

        // validasi berdasarkan type
        if (type === 'CREDIT_CARD' && (!cardLastFour || !cardBrand)) {
            return res.status(400).json({
                success: false,
                message: 'Card details are required for credit card',
            });
        }

        if (type === 'EWALLET' && (!walletProvider || !walletPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Wallet details are required for e-wallet',
            });
        }

        const existingMethods = await prisma.paymentMethod.findMany({
            where: { userId: userId! },
        });

        const shouldBeDefault = existingMethods.length === 0 || isDefault === true;

        if (shouldBeDefault) {
            await prisma.paymentMethod.updateMany({
                where: { userId: userId!, isDefault: true },
                data: { isDefault: false },
            });
        }

        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                userId: userId!,
                type,
                cardLastFour: type === 'CREDIT_CARD' ? cardLastFour : null,
                cardBrand: type === 'CREDIT_CARD' ? cardBrand : null,
                walletProvider: type === 'EWALLET' ? walletProvider : null,
                walletPhone: type === 'EWALLET' ? walletPhone : null,
                isDefault: shouldBeDefault,
                isActive: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Payment method added successfully',
            data: paymentMethod,
        });
    } catch (error: any) {
        console.error('Error adding payment method:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add payment method',
            error: error.message,
        });
    }
};
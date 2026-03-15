import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const createOrUpdateBillingAddress = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { fullName, email, country, city, zipCode, state, address, company } = req.body;

        // validasi
        if (!fullName || !email || !country || !city || !state || !address) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, country, city, state, and address are required',
            });
        }

        // billing address (create or update)
        const billingAddress = await prisma.billingAddress.upsert({
            where: { userId: userId! },
            create: {
                userId: userId!,
                fullName,
                email,
                country,
                city,
                zipCode: zipCode || null,
                state,
                address,
                company: company || null,
            },
            update: {
                fullName,
                email,
                country,
                city,
                zipCode: zipCode || null,
                state,
                address,
                company: company || null,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Billing address saved successfully',
            data: billingAddress,
        });
    } catch (error: any) {
        console.error('Error saving billing address:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save billing address',
            error: error.message,
        });
    }
};
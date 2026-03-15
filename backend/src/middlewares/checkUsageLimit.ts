import { Request, Response, NextFunction } from 'express';
import { checkUsageLimit } from '../controllers/usage/checkLimit';

export type UsageLimitType = 'bandwidth' | 'apiCalls' | 'mediaAssets' | 'projects' | 'collaborators' | 'webhooks' | 'models' | 'locales' | 'records';

// middleware untuk mengecek usage limit sebelum memulai
export const checkLimit = (usageType: UsageLimitType, soft: boolean = true) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { organizationId } = req.params;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Organization ID is required',
                });
            }

            const limitCheck = await checkUsageLimit(organizationId, usageType);

            if (!limitCheck.allowed) {
                if (!soft) {
                    return res.status(403).json({
                        success: false,
                        message: `${usageType} limit exceeded`,
                        data: {
                            used: limitCheck.used,
                            limit: limitCheck.limit,
                            percentage: limitCheck.percentage,
                            upgradeRequired: true,
                        },
                    });
                }

                req.usageWarning = {
                    type: usageType,
                    used: limitCheck.used,
                    limit: limitCheck.limit,
                    percentage: limitCheck.percentage,
                };
            }

            next();
        } catch (error) {
            console.error('Error checking usage limit:', error);
            // jika error, tetap lanjut
            next();
        }
    };
};

// perluas jenis permintaan ekspres
declare global {
    namespace Express {
        interface Request {
            usageWarning?: {
                type: string;
                used: number;
                limit: number | string;
                percentage: number;
            };
        }
    }
}
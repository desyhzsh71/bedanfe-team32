import { Request, Response, NextFunction } from 'express';
import { trackUsage } from '../controllers/usage/trackUsage';

export const trackApiCallMiddleware = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        // get organization is
        const organizationId = req.body?.organizationId || 
                              req.params?.organizationId ||
                              req.query?.organizationId;

        if (organizationId) {
            trackUsage(organizationId as string, 'apiCalls', 1).catch(err => {
                console.error('Failed to track API call:', err);
            });
        }

        next();
    } catch (error) {
        console.error('Error in API call tracking middleware:', error);
        next(); // lanjut meski tracking gagal
    }
};
import { Request, Response } from "express";

export async function profile(req: Request, res: Response) {
    res.json({
        message: "Welcome!", 
        user: (req as any).user
    });
}
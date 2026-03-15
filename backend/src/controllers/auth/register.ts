import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../../utils/prisma";

// request untuk register
export async function register(req: Request, res: Response) {
    const { fullName, email, company, job, country, password } = req.body;

    if (!email || !password || !fullName) {
        return res.status(400).json({
            message: "Required fields missing",
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                company,
                job,
                country,
                password: hashedPassword,
            },
        });

        await prisma.organization.create({
            data: {
                name: `${user.fullName}'s Workspace`,
                ownerId: user.id,
            },
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
            },
        });
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        console.error("Register error:", err);
        res.status(500).json({
            message: "Failed to register user",
        });
    }
}
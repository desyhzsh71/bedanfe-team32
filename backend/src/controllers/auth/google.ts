import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;

export async function googleAuth(req: Request, res: Response) {
    try {
        const callbackUrl = req.query.callback_url as string;

        if (!callbackUrl) {
            return res.status(400).json({ message: "callback_url is required" });
        }

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set");
            return res.status(500).json({ message: "Google OAuth is not configured" });
        }

        const state = Buffer.from(
            JSON.stringify({
                nonce: crypto.randomBytes(16).toString("hex"),
                callbackUrl,
            })
        ).toString("base64url");

        const redirectUri = `${process.env.API_URL}/api/v1/auth/google/callback`;

        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid email profile",
            access_type: "offline",
            state,
        });

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        return res.redirect(googleAuthUrl);
    } catch (error) {
        console.error("Google auth error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function googleCallback(req: Request, res: Response) {
    try {
        const { code, state } = req.query as { code: string; state: string };

        if (!code || !state) {
            return res.status(400).json({ message: "Missing code or state parameter" });
        }

        let parsedState: { nonce: string; callbackUrl: string };
        try {
            parsedState = JSON.parse(Buffer.from(state, "base64url").toString());
        } catch {
            return res.status(400).json({ message: "Invalid state parameter" });
        }

        const { callbackUrl } = parsedState;

        const redirectUri = `${process.env.API_URL}/api/v1/auth/google/callback`;

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error("Token exchange failed:", tokenData);
            return res.redirect(`${callbackUrl}?error=token_exchange_failed`);
        }

        const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            }
        );

        const googleUser = await userInfoResponse.json();

        if (!userInfoResponse.ok || !googleUser.email) {
            console.error("Failed to fetch Google user info:", googleUser);
            return res.redirect(`${callbackUrl}?error=user_info_failed`);
        }

        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: googleUser.sub },  
                    { email: googleUser.email },   
                ],
            },
        });

        if (user) {
            if (!user.googleId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: googleUser.sub },
                });
            }
        } else {
            user = await prisma.user.create({
                data: {
                    fullName: googleUser.name || googleUser.email.split("@")[0],
                    email: googleUser.email,
                    password: "",           
                    googleId: googleUser.sub,
                    company: "",
                    job: "",
                    country: "",
                },
            });

            await prisma.organization.create({
                data: {
                    name: `${user.fullName}'s Workspace`,
                    ownerId: user.id,
                },
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        const params = new URLSearchParams({
            token,
            userId: String(user.id),
            fullName: user.fullName,
            email: user.email,
            company: user.company || "",
            job: user.job || "",
            country: user.country || "",
        });

        return res.redirect(`${callbackUrl}?${params.toString()}`);
    } catch (error) {
        console.error("Google callback error:", error);
        return res.redirect(`/login?error=internal_error`);
    }
}
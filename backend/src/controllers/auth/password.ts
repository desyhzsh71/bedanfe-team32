import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from 'crypto';
import prisma from "../../utils/prisma";
import { sendPasswordResetEmail } from "../../utils/email";

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.passwordReset.deleteMany({
      where: { userId: user.id, used: false },
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(user.email, resetLink);

    return res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

// verify reset token
export async function verifyResetToken(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    if (resetRecord.used) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has already been used',
      });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: resetRecord.user.email,
        fullName: resetRecord.user.fullName,
      },
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify token',
    });
  }
}

// reset password
export async function resetPassword(req: Request, res: Response) {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required',
            });
        }

        // validasi password
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Your password must be at least 8 characters',
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match',
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const resetRecord = await prisma.passwordReset.findUnique({
            where: { token: hashedToken },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        if (resetRecord.used) {
            return res.status(400).json({
                success: false,
                message: 'This reset link has already been used',
            });
        }

        if (new Date() > resetRecord.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Reset link has expired',
            });
        }

        // hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update password dan mark token sebagai used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetRecord.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordReset.update({
                where: { id: resetRecord.id },
                data: { used: true },
            }),
        ]);

        res.status(200).json({
            success: true,
            message: 'Password has been successfully reset',
            data: {
                email: resetRecord.user.email,
            },
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
        });
    }
}
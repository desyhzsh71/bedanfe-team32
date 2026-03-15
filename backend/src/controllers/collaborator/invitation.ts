import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Status } from '../../generated';

// accept or reject invitation -> untuk user yang diundang
export async function respondToInvitation(req: Request, res: Response) {
  try {
    const { memberId } = req.params;
    const { action } = req.body as { action: 'accept' | 'reject' };
    const userId = req.user?.id;

    if (!memberId || !action) {
      return res.status(400).json({ 
        success: false,
        message: "Member ID and action are required" 
      });
    }

    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ 
        success: false,
        message: "Invalid action. Use 'accept' or 'reject'" 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    // mengecek apakah invitation ini milik user yang login atau tidak
    const member = await prisma.organizationMember.findFirst({
      where: { 
        id: memberId, 
        userId,
        status: Status.PENDING
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: "Invitation not found or already processed" 
      });
    }

    // update status berdasarkan action
    const newStatus = action === 'accept' ? Status.ACTIVE : Status.INACTIVE;
    
    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const message = action === 'accept' 
      ? "Invitation accepted successfully" 
      : "Invitation rejected";
    
    res.status(200).json({
      success: true,
      message,
      data: updatedMember
    });

  } catch (error) {
    console.error("Error responding to invitation:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to respond to invitation" 
    });
  }
}
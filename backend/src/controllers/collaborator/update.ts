import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Role } from '../../generated';

// update collaborator role - hanya owner yang bisa update
export async function updateCollaboratorRole(req: Request, res: Response) {
  try {
    const { memberId } = req.params;
    const { role } = req.body as { role: Role };
    const userId = req.user?.id;

    if (!memberId || !role) {
      return res.status(400).json({ 
        success: false,
        message: "Member ID and role are required" 
      });
    }

    // tidak bisa set role OWNER
    if (role === Role.OWNER) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot assign OWNER role. Transfer ownership instead." 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    // ambil data member
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { organization: true }
    });

    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: "Member not found" 
      });
    }

    // mengecek apakah user adalah owner atau tidak
    if (member.organization.ownerId !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "Only organization owner can update member roles" 
      });
    }

    // tidak bisa update role owner
    if (member.role === Role.OWNER) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot change owner's role" 
      });
    }

    // update role
    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: updated
    });

  } catch (error) {
    console.error("Error updating member role:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update member role" 
    });
  }
}
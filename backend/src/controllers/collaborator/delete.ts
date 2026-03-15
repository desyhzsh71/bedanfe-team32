import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Role } from '../../generated';

// delete collaborator - hanya owner
export async function deleteCollaborator(req: Request, res: Response) {
  try {
    const { memberId } = req.params;
    const userId = req.user?.id;

    if (!memberId) {
      return res.status(400).json({ 
        success: false,
        message: "Member ID is required" 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    // mengambil data member
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { 
        organization: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
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
        message: "Only organization owner can remove members" 
      });
    }

    if (member.userId === userId) {
      return res.status(400).json({ 
        success: false,
        message: "Owner cannot remove themselves. Transfer ownership or delete organization instead." 
      });
    }

    // tidak bisa hapus owner lain
    if (member.role === Role.OWNER) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot remove organization owner" 
      });
    }

    // menghapus member
    await prisma.organizationMember.delete({ 
      where: { id: memberId } 
    });

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: {
        removedMember: member.user,
        organization: {
          id: member.organization.id,
          name: member.organization.name
        }
      }
    });

  } catch (error) {
    console.error("Error deleting collaborator:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete collaborator" 
    });
  }
}
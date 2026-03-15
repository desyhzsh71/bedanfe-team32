import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Status } from '../../generated';

// get collaborators dari organization -> semua member yang aktif bisa melihat
export async function getCollaborators(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!organizationId) {
      return res.status(400).json({ 
        success: false,
        message: "Organization ID is required" 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    // mengecek apakah user adalah anggota aktif atau tidak
    const member = await prisma.organizationMember.findFirst({
      where: { 
        organizationId, 
        userId, 
        status: Status.ACTIVE 
      }
    });

    if (!member) {
      return res.status(403).json({ 
        success: false,
        message: "Only active members can view collaborators" 
      });
    }

    // mengambil semua member -> termasuk owner dan status pending
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            job: true
          }
        }
      },
      orderBy: [
        { role: "asc" }, // OWNER dulu
        { joinedAt: "desc" }
      ]
    });

    const activeMembers = members.filter(m => m.status === Status.ACTIVE);
    const pendingInvites = members.filter(m => m.status === Status.PENDING);
    const inactiveMembers = members.filter(m => m.status === Status.INACTIVE);

    res.status(200).json({
      success: true,
      message: "Collaborators retrieved successfully",
      data: {
        all: members,
        active: activeMembers,
        pending: pendingInvites,
        inactive: inactiveMembers
      },
      stats: {
        total: members.length,
        active: activeMembers.length,
        pending: pendingInvites.length,
        inactive: inactiveMembers.length
      }
    });

  } catch (error) {
    console.error("Error getting collaborators:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get collaborators" 
    });
  }
}

// get all undangan untuk user yang login
export async function getUserInvitations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    // get all undangan pending untuk user
    const invitations = await prisma.organizationMember.findMany({
      where: {
        userId,
        status: Status.PENDING
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            },
            _count: {
              select: {
                members: true,
                projects: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: "desc"
      }
    });

    res.status(200).json({
      success: true,
      message: "Invitations retrieved successfully",
      data: invitations,
      count: invitations.length
    });

  } catch (error) {
    console.error("Error getting user invitations:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get invitations" 
    });
  }
}
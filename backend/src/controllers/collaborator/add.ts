import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Role, Status } from '../../generated';

// menambahkan collaborator -> hanya owner saja yang bisa
export async function addCollaborator(req: Request, res: Response) {
  try {
    const { organizationId, email } = req.body;
    const currentUserId = req.user?.id;

    // validasi input
    if (!organizationId || !email) {
      return res.status(400).json({ 
        success: false,
        message: "Organization ID and email are required" 
      });
    }

    if (!currentUserId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    // validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const organization = await prisma.organization.findFirst({
      where: { 
        id: organizationId, 
        ownerId: currentUserId 
      },
    });

    if (!organization) {
      return res.status(403).json({ 
        success: false,
        message: "Only organization owner can add collaborators" 
      });
    }

    // mengecek apakah user dengan email tersebut ada
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        job: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User with that email not found" 
      });
    }

    // tidak bisa invite diri sendiri
    if (user.id === currentUserId) {
      return res.status(400).json({ 
        success: false,
        message: "You cannot invite yourself" 
      });
    }

    // mengecek apakah user sudah menjadi member atau sudah diundang
    const existing = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.id,
      },
    });

    if (existing) {
      if (existing.status === Status.PENDING) {
        return res.status(400).json({ 
          success: false,
          message: "User already has a pending invitation" 
        });
      }
      if (existing.status === Status.ACTIVE) {
        return res.status(400).json({ 
          success: false,
          message: "User is already a member of this organization" 
        });
      }
      if (existing.status === Status.INACTIVE) {
        return res.status(400).json({ 
          success: false,
          message: "User was previously a member. Contact admin to reactivate." 
        });
      }
    }

    // menambahkan sebagai collaborator dengan status pending
    const collaborator = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        role: Role.COLLABORATOR,
        status: Status.PENDING,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            job: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
    });

    res.status(201).json({
      success: true,
      message: "Collaborator invited successfully",
      data: collaborator,
    });

  } catch (error) {
    console.error("Error adding collaborator:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to add collaborator" 
    });
  }
}
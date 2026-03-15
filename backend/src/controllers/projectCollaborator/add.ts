import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { AddProjectCollaboratorDTO } from "../../types/project.types";
import { Status } from "../../generated";
import { PROJECT_ROLES } from "../../constants/roles";
import { checkUsageLimit, trackUsage } from "../usage";

// add collaborator ke project - hanya owner project yang bisa menambahkan
export async function addProjectCollaborator(req: Request, res: Response) {
  try {
    const { projectId, userId: targetUserId, role } = req.body as AddProjectCollaboratorDTO;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!projectId || !targetUserId || !role) {
      return res.status(400).json({
        success: false,
        message: "Project ID, user ID, and role are required"
      });
    }

    // role validasi
    if (!Object.values(PROJECT_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Valid roles: ${Object.values(PROJECT_ROLES).join(
          ", "
        )}`,
      });
    }

    // current user harus OWNER project
    const currentUserCollaborator =
      await prisma.projectCollaborator.findFirst({
        where: {
          projectId,
          userId: currentUserId,
          role: PROJECT_ROLES.OWNER,
          status: Status.ACTIVE,
        },
      });

      if (!currentUserCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can add collaborators",
      });
    }

    // mengecek apakah target user ada
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // tidak bisa menambahkan diri sendiri
    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a collaborator"
      });
    }

    // mengecek apakah project ada dan ambil organizationId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // mengecek apakah ini organizational project atau personal project
    if (!project.organizationId) {
      return res.status(400).json({
        success: false,
        message: "Cannot add collaborators to personal projects",
      });
    }

    // mengecek apakah target user adalah member organisasi
    const isOrgMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: project.organizationId,
        userId: targetUserId,
        status: Status.ACTIVE,
      },
    });

    if (!isOrgMember) {
      return res.status(400).json({
        success: false,
        message: "User must be an active organization member first",
      });
    }

    // mengecek apakah user sudah menjadi collaborator
    const existingCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: targetUserId,
      },
    });

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: "User is already a collaborator in this project",
      });
    }

    const usageCheck = await checkUsageLimit(
      project.organizationId,
      "collaborators"
    );

    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        message:
          "Collaborator limit reached. Upgrade your plan to add more collaborators.",
        data: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          percentage: usageCheck.percentage,
        },
      });
    }

    // tambahkan collaborator
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        userId: targetUserId,
        role,
        status: Status.ACTIVE,
        addedAt: new Date(),
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await trackUsage(project.organizationId, "collaborators", 1);

    res.status(201).json({
      success: true,
      message: "Collaborator added successfully",
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
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { CreateProjectDTO } from "../../types/project.types";
import { ProjectStatus, ProjectRole, Status } from "../../generated";
import { checkUsageLimit, trackUsage } from "../usage";

// create project - semua member aktif organisasi bisa membuat/menambahkan project baru
export async function createProject(req: Request, res: Response) {
  try {
    const { name, description, organizationId, deadline } =
      req.body as CreateProjectDTO;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      });
    }

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required"
      });
    }

    // mengecek apakah user adalah member aktif di organisasi
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: Status.ACTIVE,
      },
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Only active organization members can create projects",
      });
    }

    // usage limit
    const usageCheck = await checkUsageLimit(organizationId, 'projects');

    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: `Project limit reached. You have used ${usageCheck.used} of ${usageCheck.limit} projects. Please upgrade your plan.`,
        data: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          percentage: usageCheck.percentage,
        },
      });
    }

    // buat project -> otomatis menambahkan creator sebagai owner di ProjectCollaborator
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        organizationId,
        createdBy: userId,
        deadline: deadline ? new Date(deadline) : undefined,
        status: ProjectStatus.ACTIVE,
        collaborators: {
          create: {
            userId,
            role: ProjectRole.OWNER,
            status: Status.ACTIVE,
            addedAt: new Date(),
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        collaborators: {
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
          },
        },
        _count: {
          select: {
            collaborators: true,
          },
        },
      },
    });

    await trackUsage(organizationId, "projects", 1);

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
}
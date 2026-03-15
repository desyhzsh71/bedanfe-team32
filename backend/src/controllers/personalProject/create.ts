import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { checkUsageLimit, trackUsage } from "../usage";

interface CreatePersonalProjectDTO {
  name: string;
  description?: string;
  deadline?: string;
}

export async function createPersonalProject(req: Request, res: Response) {
  try {
    const { name, description, deadline } = req.body as CreatePersonalProjectDTO;
    const userId = req.user?.id;

    console.log("Creating personal project:", { name, userId }); 

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userOrg = await prisma.organizationMember.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: {
        organizationId: true,
      },
    });

    if (!userOrg) {
      return res.status(404).json({
        success: false,
        message:
          "No organization found. Please create or join an organization first.",
      });
    }

    const usageCheck = await checkUsageLimit(
      userOrg.organizationId,
      "projects"
    );

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

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: null,
        createdBy: userId,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    console.log("Project created:", project);

    await trackUsage(userOrg.organizationId, "projects", 1);

    return res.status(201).json({
      success: true,
      message: "Personal project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error creating personal project:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create personal project",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
}
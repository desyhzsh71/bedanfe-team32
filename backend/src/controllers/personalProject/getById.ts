import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export async function getPersonalProjectById(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,
        organizationId: null, // HANYA personal projects
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

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Personal project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Personal project retrieved successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error getting personal project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get personal project",
    });
  }
}
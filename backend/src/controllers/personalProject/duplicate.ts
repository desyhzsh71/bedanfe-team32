import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export async function duplicatePersonalProject(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: userId,         
        organizationId: null,       
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Personal project not found",
      });
    }

    // 🧬 duplicate
    const duplicatedProject = await prisma.project.create({
      data: {
        name: `${project.name} (Copy)`,
        description: project.description,
        deadline: project.deadline,
        status: project.status,
        customDomain: null,         
        organizationId: null,
        createdBy: userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Personal project duplicated successfully",
      data: duplicatedProject,
    });
  } catch (error) {
    console.error("Error duplicating personal project:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to duplicate personal project",
    });
  }
}
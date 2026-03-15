import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { ProjectStatus, ProjectRole, Status } from "../../generated";

export async function duplicateProjectToPersonal(req: Request, res: Response) {
  try {
    const projectId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const sourceProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!sourceProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const hasAccess = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId,
        status: Status.ACTIVE
      }
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project"
      });
    }

    const personalProject = await prisma.project.create({
      data: {
        name: `${sourceProject.name} (Copy)`,
        description: sourceProject.description,
        organizationId: null,
        status: sourceProject.status || "ACTIVE",
        customDomain: null,
        deadline: sourceProject.deadline,
        createdBy: userId,
      }
    });

    await prisma.projectCollaborator.create({
      data: {
        projectId: personalProject.id,
        userId: userId,
        role: ProjectRole.OWNER,
        status: Status.ACTIVE,
        addedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: "Project duplicated to personal successfully",
      data: personalProject
    });

  } catch (error) {
    console.error("Error duplicating project to personal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to duplicate project to personal"
    });
  }
}
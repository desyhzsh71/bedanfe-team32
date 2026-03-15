import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Status } from "../../generated";

// get project collaborators
export async function getProjectCollaborators(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        message: "Project ID is required" 
      });
    }

    // mengecek apakah user adalah collaborator di project
    const userCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId,
        status: Status.ACTIVE,
      },
    });

    if (!userCollaborator) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project",
      });
    }

    // get all collaborators
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
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
      orderBy: { addedAt: "desc" },
    });

    const activeCollaborators = collaborators.filter(c => c.status === Status.ACTIVE);
    const pendingCollaborators = collaborators.filter(c => c.status === Status.PENDING);
    const inactiveCollaborators = collaborators.filter(c => c.status === Status.INACTIVE);

    res.status(200).json({
      success: true,
      message: "Collaborators retrieved successfully",
      data: {
        all: collaborators,
        active: activeCollaborators,
        pending: pendingCollaborators,
        inactive: inactiveCollaborators,
      },
      stats: {
        total: collaborators.length,
        active: activeCollaborators.length,
        pending: pendingCollaborators.length,
        inactive: inactiveCollaborators.length,
      },
    });
  } catch (error) {
    console.error("Error getting collaborators:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get collaborators" 
    });
  }
}
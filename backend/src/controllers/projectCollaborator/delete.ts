import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { ProjectRole, Status } from "../../generated";

// remove collaborator from project -> hanya owner yang bisa menghapus
export async function removeProjectCollaborator(req: Request, res: Response) {
  try {
    const { projectId, collaboratorId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    if (!projectId || !collaboratorId) {
      return res.status(400).json({ 
        success: false,
        message: "Project ID and collaborator ID are required" 
      });
    }

    // mengecek apakah current user adalah owner atau tidak
    const currentUserCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId,
        role: ProjectRole.OWNER,
        status: Status.ACTIVE,
      },
    });

    if (!currentUserCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Only project owners can remove collaborators",
      });
    }

    // mengecek apakah collaborator yang mau dihapus ada
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id: collaboratorId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
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

    if (!collaborator || collaborator.projectId !== projectId) {
      return res.status(404).json({ 
        success: false,
        message: "Collaborator not found" 
      });
    }

    if (collaborator.userId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself from the project",
      });
    }

    if (collaborator.role === ProjectRole.OWNER) {
      const ownerCount = await prisma.projectCollaborator.count({
        where: {
          projectId,
          role: ProjectRole.OWNER,
          status: Status.ACTIVE,
        },
      });

      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove the last owner from the project",
        });
      }
    }

    // delete collaborator
    await prisma.projectCollaborator.delete({
      where: { id: collaboratorId },
    });

    res.status(200).json({
      success: true,
      message: "Collaborator removed successfully",
      data: {
        removedCollaborator: collaborator.user,
        project: collaborator.project,
      },
    });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove collaborator" 
    });
  }
}
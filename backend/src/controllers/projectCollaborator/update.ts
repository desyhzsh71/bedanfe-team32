import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { UpdateProjectCollaboratorRoleDTO } from "../../types/project.types";
import { ProjectRole, Status } from "../../generated";

// update collaborator role -> hanya owner project
export async function updateProjectCollaboratorRole(req: Request, res: Response) {
  try {
    const { projectId, collaboratorId } = req.params;
    const { role } = req.body as UpdateProjectCollaboratorRoleDTO;
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

    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: "Role is required" 
      });
    }

    // mengecek apakah current user adalah owner
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
        message: "Only project owners can update collaborator roles",
      });
    }

    // mengecek apakah collaborator yang ingin diupdate ada atau tidak
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id: collaboratorId },
    });

    if (!collaborator || collaborator.projectId !== projectId) {
      return res.status(404).json({ 
        success: false,
        message: "Collaborator not found" 
      });
    }

    // owner tidak bisa mengubah rolenya sendiri
    if (collaborator.userId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // update role
    const updated = await prisma.projectCollaborator.update({
      where: { id: collaboratorId },
      data: { role },
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
    });

    res.status(200).json({
      success: true,
      message: "Collaborator role updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating collaborator role:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update collaborator role" 
    });
  }
}
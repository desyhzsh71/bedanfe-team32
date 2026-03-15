import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { ProjectRole, Status } from "../../generated";

// delete project - hanya owner project
export async function deleteProject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Project ID is required" 
      });
    }

    // get project info sebelum dihapus
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    // mengecek apakah user adalah owner atau tidak
    const collaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId: id,
        userId,
        role: ProjectRole.OWNER,
        status: Status.ACTIVE,
      },
    });

    if (!collaborator) {
      return res.status(403).json({
        success: false,
        message: "Only project owners can delete the project",
      });
    }

    // delete project (cascade akan sekaligus menghapus collaborators)
    await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: {
        id: project.id,
        name: project.name,
      },
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete project" 
    });
  }
}
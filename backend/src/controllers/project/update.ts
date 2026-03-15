import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { UpdateProjectDTO } from "../../types/project.types";
import { ProjectRole, Status } from "../../generated";

// update project - hanya owner
export async function updateProject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, deadline, status, customDomain } =
      req.body as UpdateProjectDTO;
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
        message: "Only project owners can update the project",
      });
    }

    // update project
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(status && { status }),
        ...(customDomain !== undefined && { customDomain }),
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

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update project" 
    });
  }
}
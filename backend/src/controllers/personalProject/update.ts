import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { ProjectStatus } from "../../generated";

interface UpdatePersonalProjectDTO {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  customDomain?: string;
  deadline?: string;
}

export async function updatePersonalProject(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { name, description, status, customDomain, deadline } = req.body as UpdatePersonalProjectDTO;
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

    // Cek apakah project ini milik user
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

    // Validate status if provided
    const validStatuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
        ...(customDomain !== undefined && { customDomain: customDomain?.trim() || null }),
        ...(deadline && { deadline: new Date(deadline) }),
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

    res.status(200).json({
      success: true,
      message: "Personal project updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating personal project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update personal project",
    });
  }
}
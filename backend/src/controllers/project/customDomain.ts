import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { ProjectRole, Status } from "../../generated";

// update custom domain -> hanya owner yang bisa ubah
export async function updateCustomDomain(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { customDomain } = req.body;
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

    if (!customDomain || customDomain.trim() === "") {
      return res.status(400).json({ 
        success: false,
        message: "Custom domain is required" 
      });
    }

    // mengecek apakah user adalah owner dari project ini
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
        message: "Only project owners can update custom domain",
      });
    }

    // mengecek apakah domain sudah dipakai atau tidak
    const existingDomain = await prisma.project.findFirst({
      where: {
        customDomain: customDomain.trim(),
        NOT: { id }, // kecuali project ini sendiri
      },
    });

    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: "This custom domain is already in use",
      });
    }

    // update custom domain
    const updated = await prisma.project.update({
      where: { id },
      data: {
        customDomain: customDomain.trim(),
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
      },
    });

    res.status(200).json({
      success: true,
      message: "Custom domain updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating custom domain:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update custom domain" 
    });
  }
}
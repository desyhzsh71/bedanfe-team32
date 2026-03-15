import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export async function deletePersonalProject(req: Request, res: Response) {
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

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.status(200).json({
      success: true,
      message: "Personal project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting personal project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete personal project",
    });
  }
}
import { Request, Response } from "express";
import prisma from "../../utils/prisma";

// delete organization - hanya owner saja yang bisa
export async function deleteOrganization(req: Request, res: Response) {
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
        message: "Organization ID is required" 
      });
    }

    // mengecek apakah user adalah owner atau tidak
    const organization = await prisma.organization.findFirst({
      where: { 
        id, 
        ownerId: userId 
      },
      include: {
        _count: {
          select: {
            projects: true,
            members: true
          }
        }
      }
    });

    if (!organization) {
      return res.status(403).json({ 
        success: false,
        message: "Only organization owner can delete organization" 
      });
    }

    // mengecek apakah masih ada project yang aktif
    if (organization._count.projects > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot delete organization with active projects. Delete all projects first." 
      });
    }

    // hapus organization (cascade akan menghapus members juga)
    await prisma.organization.delete({ 
      where: { id } 
    });

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully",
      data: {
        id: organization.id,
        name: organization.name
      }
    });

  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete organization" 
    });
  }
}
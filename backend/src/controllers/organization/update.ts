import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { UpdateOrganizationDTO } from "../../types/organization.types";

// update organization - hanya owner
export async function updateOrganization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body as UpdateOrganizationDTO;
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

    if (!name || name.trim() === "") {
      return res.status(400).json({ 
        success: false,
        message: "Organization name is required" 
      });
    }

    // mengecek apakah user adalah owner atau tidak
    const organization = await prisma.organization.findFirst({
      where: { 
        id, 
        ownerId: userId 
      }
    });

    if (!organization) {
      return res.status(403).json({ 
        success: false,
        message: "Only organization owner can update organization" 
      });
    }

    // update organization
    const updated = await prisma.organization.update({
      where: { id },
      data: { 
        name: name.trim()
      },
      include: {
        owner: {
          select: { 
            id: true, 
            fullName: true, 
            email: true 
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                company: true,
                job: true
              }
            }
          }
        },
        _count: {
          select: { 
            members: true, 
            projects: true 
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: updated
    });

  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update organization" 
    });
  }
}
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { CreateOrganizationDTO } from "../../types/organization.types";
import { Role, Status } from "../../generated";

// create organization - user yang membuat organisasi otomatis menjadi owner
export async function createOrganization(req: Request, res: Response) {
  try {
    const { name } = req.body as CreateOrganizationDTO;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ 
        success: false,
        message: "Organization name is required" 
      });
    }

    // mengecek apakah user ada
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // membuat organization dengan user sebagai owner
    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        members: {
          create: {
            userId,
            role: Role.OWNER,
            status: Status.ACTIVE,
            joinedAt: new Date()
          }
        }
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

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization
    });

  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create organization" 
    });
  }
}
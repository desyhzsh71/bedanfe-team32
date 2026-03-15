import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { OrganizationQueryParams } from "../../types/organization.types";
import { Role, Status } from "../../generated";

// get all organizations
export async function getOrganizations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = "name",
      sortOrder = "asc"
    } = req.query as OrganizationQueryParams;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // mengambil semua organisasi dimana user adalah member aktif
    const where: any = {
      members: {
        some: {
          userId,
          status: Status.ACTIVE
        }
      }
    };

    if (search) {
      where.name = { 
        contains: search, 
        mode: "insensitive" 
      };
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: { 
              id: true, 
              fullName: true, 
              email: true 
            }
          },
          members: {
            where: { status: Status.ACTIVE },
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
          projects: {
            select: { 
              id: true, 
              name: true, 
              status: true 
            }
          },
          _count: {
            select: { 
              members: true, 
              projects: true 
            }
          }
        }
      }),
      prisma.organization.count({ where })
    ]);

    // menambahkan stats untuk setiap organization
    const organizationsWithStats = organizations.map((org) => {
      // mengecek apakah user adalah owner atau tidak
      const userMember = org.members.find(m => m.userId === userId);
      const isOwner = org.ownerId === userId;

      return {
        ...org,
        userRole: userMember?.role || null,
        isOwner,
        stats: {
          totalMembers: org._count.members,
          totalProjects: org._count.projects,
          activeMembers: org.members.filter(
            m => m.status === Status.ACTIVE
          ).length,
          collaborators: org.members.filter(
            m => m.role === Role.COLLABORATOR && m.status === Status.ACTIVE
          ).length
        }
      };
    });

    res.status(200).json({
      success: true,
      message: "Organizations retrieved successfully",
      data: organizationsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error getting organizations:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get organizations" 
    });
  }
}

// get organization dari ID
export async function getOrganizationById(req: Request, res: Response) {
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

    // mengambil organisasi hanya ketika user adalah member aktif
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
            status: Status.ACTIVE
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
          },
          orderBy: { joinedAt: "desc" }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true
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

    if (!organization) {
      return res.status(404).json({ 
        success: false,
        message: "Organization not found or access denied" 
      });
    }

    // mengambil role user di organization
    const userMember = organization.members.find(m => m.userId === userId);
    const isOwner = organization.ownerId === userId;

    const stats = {
      totalMembers: organization._count.members,
      totalProjects: organization._count.projects,
      activeMembers: organization.members.filter(
        m => m.status === Status.ACTIVE
      ).length,
      collaborators: organization.members.filter(
        m => m.status === Status.ACTIVE && m.role === Role.COLLABORATOR
      ).length,
      pendingInvites: organization.members.filter(
        m => m.status === Status.PENDING
      ).length
    };

    res.status(200).json({
      success: true,
      message: "Organization retrieved successfully",
      data: {
        ...organization,
        userRole: userMember?.role || null,
        isOwner,
        stats
      }
    });

  } catch (error) {
    console.error("Error getting organization:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get organization" 
    });
  }
}
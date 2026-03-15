import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { ProjectQueryParams } from "../../types/project.types";
import { ProjectRole, Status } from "../../generated";

// get all projects
export async function getProjects(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const {
      organizationId,
      search,
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as ProjectQueryParams;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      collaborators: {
        some: {
          userId,
          status: Status.ACTIVE,
        },
      },
    };

    if (organizationId) {
      // verifikasi user jika merupakan member aktif organisasi
      const isMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          status: Status.ACTIVE,
        },
      });

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this organization",
        });
      }

      where.organizationId = organizationId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (status) {
      where.status = status;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
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
            where: { status: Status.ACTIVE },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
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
      }),
      prisma.project.count({ where }),
    ]);

    // add user role info
    const projectsWithUserRole = projects.map((project) => {
      const userCollaborator = project.collaborators.find(
        (c) => c.userId === userId
      );

      return {
        ...project,
        userRole: userCollaborator?.role || null,
        isCreator: project.createdBy === userId,
      };
    });

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projectsWithUserRole,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting projects:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get projects" 
    });
  }
}

// get project ID
export async function getProjectById(req: Request, res: Response) {
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

    // get project hanya ketika user adalah collaborator aktif
    const project = await prisma.project.findFirst({
      where: {
        id,
        collaborators: {
          some: {
            userId,
            status: Status.ACTIVE,
          },
        },
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
          orderBy: { addedAt: "desc" },
        },
        _count: {
          select: {
            collaborators: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    // get user role
    const userCollaborator = project.collaborators.find(
      (c) => c.userId === userId
    );

    const stats = {
      totalCollaborators: project._count.collaborators,
      activeCollaborators: project.collaborators.filter(
        (c) => c.status === Status.ACTIVE
      ).length,
      pendingCollaborators: project.collaborators.filter(
        (c) => c.status === Status.PENDING
      ).length,
      ownerCount: project.collaborators.filter(
        (c) => c.role === ProjectRole.OWNER && c.status === Status.ACTIVE
      ).length,
      editorCount: project.collaborators.filter(
        (c) => c.role === ProjectRole.EDITOR && c.status === Status.ACTIVE
      ).length,
      viewerCount: project.collaborators.filter(
        (c) => c.role === ProjectRole.VIEWER && c.status === Status.ACTIVE
      ).length,
    };

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: {
        ...project,
        userRole: userCollaborator?.role || null,
        isCreator: project.createdBy === userId,
        stats,
      },
    });
  } catch (error) {
    console.error("Error getting project:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get project" 
    });
  }
}
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { ProjectStatus, ProjectRole, Status } from "../../generated";

// duplicate project -> hanya owner saja. ini fungsinya buat copy project lama ke project baru di organisasi yang sama
export async function duplicateProject(req: Request, res: Response) {
  try {
    const { id } = req.params; // project yang ingin diduplicate
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
        message: "Only project owners can duplicate the project" 
      });
    }

    // get project yang ingin diduplicate
    const originalProject = await prisma.project.findUnique({
      where: { id },
      include: {
        collaborators: true,
      },
    });

    if (!originalProject) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    // create project baru (sebagai copyan)
    const duplicatedProject = await prisma.project.create({
      data: {
        name: `${originalProject.name} (Copy)`,
        description: originalProject.description,
        organizationId: originalProject.organizationId,
        createdBy: userId,
        deadline: originalProject.deadline,
        status: ProjectStatus.ACTIVE,
        // customDomain tidak dicopy!
        collaborators: {
          create: originalProject.collaborators.map((collab) => ({
            userId: collab.userId,
            role: collab.role,
            status: collab.status,
            addedAt: new Date(),
          })),
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
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Project duplicated successfully",
      data: duplicatedProject,
    });
  } catch (error) {
    console.error("Error duplicating project:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to duplicate project" 
    });
  }
}

// duplicate project ke organisasi lain
export async function duplicateProjectToOrganization(req: Request, res: Response) {
  try {
    const { id } = req.params; // project yang ingin diduplicate
    const { targetOrganizationId } = req.body;
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

    if (!targetOrganizationId) {
      return res.status(400).json({
        success: false,
        message: "Target organization ID is required",
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
        message: "Only project owners can duplicate the project",
      });
    }

    // mengecek apakah user merupakan member aktif di organisasi (target)
    const targetOrgMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: targetOrganizationId,
        userId,
        status: Status.ACTIVE,
      },
    });

    if (!targetOrgMember) {
      return res.status(403).json({
        success: false,
        message: "You must be an active member of the target organization",
      });
    }

    // get project yang ingin diduplicate
    const originalProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!originalProject) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    // membuat project baru di organisasi (target)
    const duplicatedProject = await prisma.project.create({
      data: {
        name: originalProject.name,
        description: originalProject.description,
        organizationId: targetOrganizationId,
        createdBy: userId,
        deadline: originalProject.deadline,
        status: ProjectStatus.ACTIVE,
        customDomain: originalProject.customDomain,
        collaborators: {
          create: {
            userId,
            role: ProjectRole.OWNER,
            status: Status.ACTIVE,
            addedAt: new Date(),
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
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Project duplicated to organization successfully",
      data: duplicatedProject,
    });
  } catch (error) {
    console.error("Error duplicating project:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to duplicate project" 
    });
  }
}
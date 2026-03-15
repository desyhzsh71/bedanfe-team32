import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { Role, Status } from "../generated";

export const isOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const organizationId =
      req.params.id || req.params.organizationId || req.body?.organizationId;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID and user required",
      });
    }

    const organization = await prisma.organization.findFirst({
      where: { id: organizationId, ownerId: userId },
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        message: "Only organization owner can perform this action",
      });
    }

    (req as any).organization = organization;
    next();
  } catch (error) {
    console.error("Owner check failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const isActiveMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const organizationId =
      req.params.id || req.params.organizationId || req.body.organizationId;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID and user required",
      });
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: Status.ACTIVE,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Only active members can access this resource",
      });
    }

    (req as any).member = member;
    (req as any).isOwner = member.organization.ownerId === userId;
    next();
  } catch (error) {
    console.error("Member check failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const hasRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const organizationId =
        req.params.id || req.params.organizationId || req.body.organizationId;

      if (!organizationId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Organization ID and user required",
        });
      }

      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          status: Status.ACTIVE,
          role: { in: allowedRoles },
        },
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      (req as any).member = member;
      next();
    } catch (error) {
      console.error("Role check failed:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};
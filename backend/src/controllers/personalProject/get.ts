import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { Status } from "../../generated";

export async function getPersonalProjects(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { search, status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Build filter
    const where: any = {
      createdBy: userId,
      organizationId: null, // HANYA personal projects (tanpa organisasi)
    };

    if (search) {
      where.name = {
        contains: String(search),
        mode: "insensitive",
      };
    }

    if (status) {
      where.status = String(status);
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects with pagination
    const projects = await prisma.project.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        [String(sortBy)]: String(sortOrder),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        customDomain: true,
        createdAt: true,
        updatedAt: true,
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
      message: "Personal projects retrieved successfully",
      data: projects,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting personal projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get personal projects",
    });
  }
}
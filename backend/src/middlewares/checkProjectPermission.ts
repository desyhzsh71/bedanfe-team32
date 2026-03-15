import { Request, Response, NextFunction } from 'express';
import { ProjectRole } from '../generated';
import prisma from '../utils/prisma';

declare global {
    namespace Express {
        interface Request {
            projectRole?: ProjectRole;
        }
    }
}

export async function checkProjectAccess(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        const { projectId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required',
            });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                collaborators: {
                    where: {
                        userId,
                        status: 'ACTIVE',
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        const userIdAsInt = parseInt(String(userId), 10);
        const isCreator = project.createdBy === userIdAsInt;

        console.log('Project Access Check:');
        console.log('  userId:', userId, '(type:', typeof userId, ')');
        console.log('  userIdAsInt:', userIdAsInt, '(type:', typeof userIdAsInt, ')');
        console.log('  project.createdBy:', project.createdBy, '(type:', typeof project.createdBy, ')');
        console.log('  isCreator:', isCreator);
        console.log('  collaborators:', project.collaborators.length);

        const isCollaborator = project.collaborators.length > 0;

        if (!isCreator && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this project',
            });
        }

        if (isCreator) {
            req.projectRole = ProjectRole.OWNER;
        } else {
            req.projectRole = project.collaborators[0].role;
        }

        console.log('Access granted with role:', req.projectRole);
        next();
    } catch (error) {
        console.error('Project permission check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check project permission',
        });
    }
}

export function requireProjectRole(minimumRole: ProjectRole) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const currentRole = req.projectRole;

            if (!currentRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Project role not found. Please check project access first',
                });
            }

            const roleHierarchy: Record<ProjectRole, number> = {
                [ProjectRole.OWNER]: 8,
                [ProjectRole.ADMIN]: 7,
                [ProjectRole.MANAGER]: 6,
                [ProjectRole.EDITOR]: 5,
                [ProjectRole.REVIEWER]: 4,
                [ProjectRole.AUTHOR]: 3,
                [ProjectRole.CONTRIBUTOR]: 2,
                [ProjectRole.VIEWER]: 1,
            };
            const currentRoleLevel = roleHierarchy[currentRole];
            const requiredRoleLevel = roleHierarchy[minimumRole];

            if (currentRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    success: false,
                    message: `This action requires ${minimumRole} role or higher. You are ${currentRole}`,
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check role permission',
            });
        }
    };
}
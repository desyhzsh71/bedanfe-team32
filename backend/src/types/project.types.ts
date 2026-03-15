import { ProjectStatus, ProjectRole, Status } from "../generated";

export interface CreateProjectDTO {
  name: string;
  description?: string;
  organizationId: string;
  deadline?: Date | string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  deadline?: Date | string;
  status?: ProjectStatus;
  customDomain?: string;
}

export interface ProjectQueryParams {
  organizationId?: string;
  search?: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AddProjectCollaboratorDTO {
  projectId: string;
  userId: number;
  role: ProjectRole;
}

export interface UpdateProjectCollaboratorRoleDTO {
  role: ProjectRole;
}

export interface ProjectStats {
  totalCollaborators: number;
  activeCollaborators: number;
  pendingCollaborators: number;
  ownerCount: number;
  editorCount: number;
  viewerCount: number;
}

export interface CollaboratorWithUser {
  id: string;
  projectId: string;
  userId: number;
  role: ProjectRole;
  status: Status;
  addedAt: Date;
  user: {
    id: number;
    fullName: string;
    email: string;
    company: string;
    job: string;
  };
}
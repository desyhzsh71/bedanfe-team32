import { Role, Status } from "../generated";

export interface CreateOrganizationDTO {
  name: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
}

export interface OrganizationQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AddCollaboratorDTO {
  organizationId: string;
  email: string;
}

export interface RespondInvitationDTO {
  action: "accept" | "reject";
}

export interface UpdateCollaboratorRoleDTO {
  role: Role;
}

export interface OrganizationStats {
  totalMembers: number;
  totalProjects: number;
  activeMembers: number;
  collaborators: number;
  pendingInvites?: number;
}

export interface MemberWithUser {
  id: string;
  userId: number;
  organizationId: string;
  role: Role;
  status: Status;
  joinedAt: Date;
  user: {
    id: number;
    fullName: string;
    email: string;
    company?: string;
    job?: string;
  };
}
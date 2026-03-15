import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;

  members?: any[];
  collaborators?: any[];
  mediaAssets?: any[];
  assets?: any[];
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    if (!baseUrl) {
      throw new Error('API_URL is required! Check your NEXT_PUBLIC_API_URL in .env');
    }

    this.baseUrl = baseUrl.replace(/\/$/, '');
    console.log('API Service initialized with baseUrl:', this.baseUrl);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      // ── FIX: Handle 404 — resource not found ─────────────────────────────
      if (
        response.status === 404 &&
        (data.message?.includes('not found') ||
          data.message?.includes('No active'))
      ) {
        return data; // Return silently, don't throw
      }

      // ── FIX: Handle 400 — content belum pernah disimpan ──────────────────
      // Backend mengembalikan 400 "Data is required" ketika konten belum ada,
      // bukan 404. Kita tangkap ini dan return data kosong agar UI tidak error.
      if (
        response.status === 400 &&
        (data.message?.toLowerCase().includes('data is required') ||
          data.message?.toLowerCase().includes('content not found') ||
          data.message?.toLowerCase().includes('no content'))
      ) {
        return { success: false, data: null, message: data.message } as T;
      }

      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  private buildHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const authHeader = getAuthHeader();
      Object.assign(headers, authHeader);
    }

    return headers;
  }

  // GET
  async get<T = any>(endpoint: string, token?: string): Promise<T> {
    const fullUrl = `${this.baseUrl}${endpoint}`;

    console.log('  API GET Request:');
    console.log('  Base URL:', this.baseUrl);
    console.log('  Endpoint:', endpoint);
    console.log('  Full URL:', fullUrl);
    console.log('  Headers:', this.buildHeaders(token));

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: this.buildHeaders(token),
    });

    return this.handleResponse<T>(response);
  }

  // GET blog entries (multiple page entries)
  async getBlogEntries(
    multiplePageId: string,
    token: string,
    params?: {
      locale?: string;
      published?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse> {
    let queryString = '';

    if (params) {
      const searchParams = new URLSearchParams();

      if (params.locale) searchParams.append('locale', params.locale);
      if (params.published !== undefined) searchParams.append('published', params.published.toString());
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());

      const query = searchParams.toString();
      if (query) queryString = `?${query}`;
    }

    return this.get(`/content-builder/multiple-pages/${multiplePageId}/entries${queryString}`, token);
  }

  // GET single blog entry by slug
  async getBlogEntryBySlug(
    multiplePageId: string,
    slug: string,
    token: string,
    locale?: string
  ): Promise<ApiResponse> {
    const query = locale ? `?locale=${locale}` : '';
    return this.get(`/content-builder/multiple-pages/${multiplePageId}/entries/slug/${slug}${query}`, token);
  }

  // POST
  async post<T = any>(endpoint: string, data?: any, token?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.buildHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // PUT
  async put<T = any>(endpoint: string, data?: any, token?: string): Promise<T> {
    const isFormData = data instanceof FormData;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      },
      body:
        data === undefined
          ? undefined
          : isFormData
            ? data
            : JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // PATCH
  async patch<T = any>(endpoint: string, data?: any, token?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.buildHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // DELETE
  async delete<T = any>(endpoint: string, token?: string, body?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.buildHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  //AUTH
  //register
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    company: string;
    job: string;
    country: string;
  }): Promise<ApiResponse> {
    return this.post('/auth/register', data);
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse> {
    return this.post('/auth/login', data);
  }

  async getProfile(token: string): Promise<ApiResponse> {
    return this.get('/auth/profile', token);
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.post('/auth/forgot-password', { email });
  }

  async verifyResetToken(token: string): Promise<ApiResponse> {
    return this.get(`/auth/verify-reset-token?token=${token}`);
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> {
    return this.post('/auth/reset-password', data);
  }

  async getCountries(): Promise<ApiResponse<string[]>> {
    return this.get('/auth');
  }

  // ORGANIZATION
  // create organization
  async createOrganization(name: string, token: string): Promise<ApiResponse> {
    return this.post('/organizations', { name }, token);
  }

  // get organization
  async getOrganizations(
    token: string,
    params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse> {
    let queryString = '';

    if (params) {
      const searchParams = new URLSearchParams();

      if (params.search) searchParams.append('search', params.search);
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

      const query = searchParams.toString();
      if (query) queryString = `?${query}`;
    }

    return this.get(`/organizations${queryString}`, token);
  }

  // get organization berdasarkan id
  async getOrganizationById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/organizations/${id}`, token);
  }

  // updtae organization
  async updateOrganization(id: string, name: string, token: string): Promise<ApiResponse> {
    return this.put(`/organizations/${id}`, { name }, token);
  }

  // delete organization
  async deleteOrganization(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/organizations/${id}`, token);
  }

  // PROJECTS (ORGANIZATIONAL)
  // get project berdasarkan organisasi
  async getProjectsByOrganization(
    organizationId: string,
    token: string,
    params?: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse> {
    const queryString = params
      ? `?organizationId=${organizationId}&${new URLSearchParams(params as any).toString()}`
      : `?organizationId=${organizationId}`;
    return this.get(`/projects${queryString}`, token);
  }

  // get project berdasarkan id
  async getProjectById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/projects/${id}`, token);
  }

  // create project (organizational)
  async createProject(
    data: {
      name: string;
      description?: string;
      organizationId: string;
      deadline?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/projects', data, token);
  }

  // update project (organizational)
  async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      deadline?: string;
      status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
      customDomain?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/projects/${id}`, data, token);
  }

  // delete project (organizational)
  async deleteProject(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/projects/${id}`, token);
  }

  // duplicate project (organizational)
  async duplicateProject(id: string, token: string): Promise<ApiResponse> {
    return this.post(`/projects/${id}/duplicate`, {}, token);
  }

  // duplicate project ke organisasi lain
  async duplicateProjectToOrganization(
    id: string,
    targetOrganizationId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/projects/${id}/duplicate-to-org`, { targetOrganizationId }, token);
  }

  // update custom domain
  async updateCustomDomain(
    id: string,
    customDomain: string,
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/projects/${id}/custom-domain`, { customDomain }, token);
  }

  // PERSONAL PROJECTS
  // get all personal projects
  async getPersonalProjects(
    token: string,
    params?: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';

    return this.get(`/personal-projects${queryString}`, token);
  }

  // get personal project berdasarkan id
  async getPersonalProjectById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/personal-projects/${id}`, token);
  }

  // create personal project
  async createPersonalProject(
    data: {
      name: string;
      description?: string;
      deadline?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/personal-projects', data, token);
  }

  // update personal project
  async updatePersonalProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      deadline?: string;
      status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
      customDomain?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/personal-projects/${id}`, data, token);
  }

  // duplicate personal project
  async duplicatePersonalProject(
    id: string,
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/personal-projects/${id}/duplicate`, {}, token);
  }

  // duplicate project to personal
  async duplicateProjectToPersonal(
    projectId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/projects/${projectId}/duplicate-to-personal`, {}, token);
  }

  // delete personal project
  async deletePersonalProject(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/personal-projects/${id}`, token);
  }

  // ORGANIZATION COLLABORATORS
  // get organization collaborators
  async getOrganizationCollaborators(
    organizationId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/collaborators/${organizationId}`, token);
  }

  // add collaborator ke organization
  async addOrganizationCollaborator(
    data: {
      organizationId: string;
      email: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/collaborators', data, token);
  }

  // get user invitations
  async getUserInvitations(token: string): Promise<ApiResponse> {
    return this.get('/collaborators/invitations', token);
  }

  // respond untuk invitation (accept/reject)
  async respondToInvitation(
    memberId: string,
    action: 'accept' | 'reject',
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/collaborators/${memberId}/respond`, { action }, token);
  }

  // update collaborator role
  async updateCollaboratorRole(
    memberId: string,
    role: string,
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/collaborators/${memberId}/role`, { role }, token);
  }

  // remove collaborator dari organisasi
  async removeCollaborator(memberId: string, organizationId: string, token: string): Promise<ApiResponse> {
    return this.delete(`/collaborators/${memberId}`, token, {
      organizationId: organizationId
    });
  }

  // PROJECT COLLABORATORS
  // get project collaborators
  async getProjectCollaborators(
    projectId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/project-collaborators/${projectId}`, token);
  }

  // add collaborator ke project
  async addProjectCollaborator(
    data: {
      projectId: string;
      userId: number;
      role: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/project-collaborators', data, token);
  }

  // update project collaborator role
  async updateProjectCollaboratorRole(
    projectId: string,
    collaboratorId: string,
    role: string,
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/project-collaborators/${projectId}/${collaboratorId}`, { role }, token);
  }

  // remove project collaborator
  async removeProjectCollaborator(
    projectId: string,
    collaboratorId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.delete(`/project-collaborators/${projectId}/${collaboratorId}`, token);
  }

  // WORKFLOW
  // create workflow
  async createWorkflow(
    organizationId: string,
    data: {
      name: string;
      relatedTo: string;
      keyApprovalStage: string;
      stages: Array<{
        name: string;
        description?: string;
        order?: number;
        highlightColor?: string;
        rolesAllowed?: string[];
      }>;
    },
    token: string
  ): Promise<ApiResponse> {
    console.log('API Call: Create Workflow');
    console.log('Organization ID:', organizationId);
    console.log('Endpoint:', `/organizations/${organizationId}/workflows`);
    console.log('Data:', JSON.stringify(data, null, 2));

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      throw new Error(`Invalid Organization ID format: ${organizationId}. Expected UUID format.`);
    }

    return this.post(`/organizations/${organizationId}/workflows`, data, token);
  }

  // get all workflows
  async getAllWorkflows(organizationId: string, token: string): Promise<ApiResponse> {
    return this.get(`/organizations/${organizationId}/workflows?include=stages`, token);
  }

  // get workflow berdasarkan id
  async getWorkflowById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/workflows/${id}`, token);
  }

  // get workflow berdasarkan entries
  async getWorkflowEntries(
    workflowId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/workflows/${workflowId}/entries`, token);
  }

  // update workflow
  async updateWorkflow(
    id: string,
    data: {
      name?: string;
      relatedTo?: string;
      keyApprovalStage?: string;
      stages?: Array<{
        name: string;
        order?: number;
        highlightColor?: string;
        rolesAllowed?: string[];
      }>;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/workflows/${id}`, data, token);
  }

  // delete workflow
  async deleteWorkflow(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/workflows/${id}`, token);
  }

  // assign workflow
  async assignWorkflow(
    data: {
      workflowId: string;
      singlePageId?: string;
      multiplePageId?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/workflow-assignments', data, token);
  }

  // remove workflow assignment
  async removeWorkflowAssignment(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/workflow-assignments/${id}`, token);
  }

  // get workflow page
  async getWorkflowForPage(
    pageType: string,
    pageId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/pages/${pageType}/${pageId}/workflow`, token);
  }

  // move content 
  async moveContentToStage(
    data: {
      contentType: 'SINGLE_PAGE' | 'MULTIPLE_PAGE';
      contentId: string;
      workflowStageId: string;
      notes?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/content/move-to-stage', data, token);
  }

  // get content currentstage
  async getContentCurrentStage(
    contentType: string,
    contentId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/content/${contentType}/${contentId}/current-stage`, token);
  }

  // get content workflow teman sama....
  async getContentWorkflowHistory(
    contentType: string,
    contentId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/content/${contentType}/${contentId}/workflow-history`, token);
  }

  // CONTENT BUILDER (SINGLE PAGE)
  //create single page
  async createSinglePage(
    projectId: string,
    data: {
      name: string;
      apiId?: string;
      multiLanguage?: boolean;
      seoEnabled?: boolean;
      workflowEnabled?: boolean;
    },
    token: string
  ): Promise<ApiResponse> {
    console.log('API Call: Create Single Page');
    console.log('Endpoint:', `/content-builder/projects/${projectId}/single-pages`);
    console.log('Data:', data);
    return this.post(`/content-builder/projects/${projectId}/single-pages`, data, token);
  }

  // get single page berasarkan project
  async getSinglePagesByProject(
    projectId: string,
    token: string
  ): Promise<ApiResponse> {
    console.log('API Call: Get Single Pages by Project');
    console.log('Endpoint:', `/content-builder/projects/${projectId}/single-pages`);
    return this.get(`/content-builder/projects/${projectId}/single-pages`, token);
  }

  // get single page berdasarkan id
  async getSinglePageById(id: string, token: string): Promise<ApiResponse> {
    console.log('API Call: Get Single Page by ID');
    console.log('Endpoint:', `/content-builder/single-pages/${id}`);
    return this.get(`/content-builder/single-pages/${id}`, token);
  }

  // update single page
  async updateSinglePage(
    id: string,
    data: {
      name?: string;
      apiId?: string;
      multiLanguage?: boolean;
      seoEnabled?: boolean;
      workflowEnabled?: boolean;
      published?: boolean;
    },
    token: string
  ): Promise<ApiResponse> {
    console.log('API Call: Update Single Page');
    console.log('Endpoint:', `/content-builder/single-pages/${id}`);
    return this.put(`/content-builder/single-pages/${id}`, data, token);
  }

  // delete single page
  async deleteSinglePage(id: string, token: string): Promise<ApiResponse> {
    console.log('API Call: Delete Single Page');
    console.log('Endpoint:', `/content-builder/single-pages/${id}`);
    return this.delete(`/content-builder/single-pages/${id}`, token);
  }

  // toggle publish single page
  async togglePublishSinglePage(id: string, token: string): Promise<ApiResponse> {
    console.log('API Call: Toggle Publish Single Page');
    console.log('Endpoint:', `/content-builder/single-pages/${id}/toggle-publish`);
    return this.patch(`/content-builder/single-pages/${id}/toggle-publish`, {}, token);
  }

  // CONTENT BUILDER (MULTIPLE PAGE)
  // create multiple page
  async createMultiplePage(
    projectId: string,
    data: {
      name: string;
      apiId?: string;
      multiLanguage?: boolean;
      seoEnabled?: boolean;
      workflowEnabled?: boolean;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/content-builder/projects/${projectId}/multiple-pages`, data, token);
  }

  // get multiple page berdasarkan project
  async getMultiplePagesByProject(
    projectId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/content-builder/projects/${projectId}/multiple-pages`, token);
  }

  // get multiple page berdasarkan id
  async getMultiplePageById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/content-builder/multiple-pages/${id}`, token);
  }

  // update multiple page
  async updateMultiplePage(
    id: string,
    data: {
      name?: string;
      apiId?: string;
      multiLanguage?: boolean;
      seoEnabled?: boolean;
      workflowEnabled?: boolean;
      published?: boolean;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/content-builder/multiple-pages/${id}`, data, token);
  }

  // delete multiple page
  async deleteMultiplePage(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/content-builder/multiple-pages/${id}`, token);
  }

  // toggle publish multiple page
  async togglePublishMultiplePage(id: string, token: string): Promise<ApiResponse> {
    return this.patch(`/content-builder/multiple-pages/${id}/toggle-publish`, {}, token);
  }

  // CONTENT BUILDER (COMPONENT)
  // create component
  async createComponent(
    projectId: string,
    data: {
      name: string;
      apiId?: string;
      description?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/content-builder/projects/${projectId}/components`, data, token);
  }

  // get component berdasarkan project
  async getComponentsByProject(
    projectId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/content-builder/projects/${projectId}/components`, token);
  }

  // get component berdasarkan id
  async getComponentById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/content-builder/components/${id}`, token);
  }

  // update component
  async updateComponent(
    id: string,
    data: {
      name?: string;
      apiId?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/content-builder/components/${id}`, data, token);
  }

  // delete component
  async deleteComponent(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/content-builder/components/${id}`, token);
  }

  // CONTENT BUILDER (FIELD)
  // create field
  async createField(
    data: {
      name: string;
      apiId?: string;
      type: string;
      required?: boolean;
      unique?: boolean;
      singlePageId?: string;
      multiplePageId?: string;
      componentId?: string;
      validations?: any;
      defaultValue?: any;
      options?: any;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/content-builder/fields', data, token);
  }

  // get field berdasarkan parent
  async getFieldsByParent(
    parentType: 'single-page' | 'multiple-page' | 'component',
    parentId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/content-builder/${parentType}/${parentId}/fields`, token);
  }

  // get field berdasarkan id
  async getFieldById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/content-builder/fields/${id}`, token);
  }

  // update field
  async updateField(
    id: string,
    data: {
      name?: string;
      apiId?: string;
      type?: string;
      required?: boolean;
      unique?: boolean;
      validations?: any;
      defaultValue?: any;
      options?: any;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/content-builder/fields/${id}`, data, token);
  }

  // delete field
  async deleteField(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/content-builder/fields/${id}`, token);
  }

  // reorder field
  async reorderFields(
    fieldIds: string[],
    token: string
  ): Promise<ApiResponse> {
    return this.post('/content-builder/fields/reorder', { fieldIds }, token);
  }

  // duplicate field
  async duplicateField(id: string, token: string): Promise<ApiResponse> {
    return this.post(`/content-builder/fields/${id}/duplicate`, {}, token);
  }

  // CONTENT MANAGEMENT
  // get content
  async getContentStructure(
    singlePageId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/content-management/single-pages/${singlePageId}/structure`, token);
  }

  // save content
  async saveContent(
    singlePageId: string,
    data: {
      data: any;
      locale?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/content-management/single-pages/${singlePageId}/content`, data, token);
  }

  // get current content
  async getCurrentContent(
    singlePageId: string,
    token: string,
    locale?: string
  ): Promise<ApiResponse> {
    const query = locale ? `?locale=${locale}` : '';
    return this.get(`/content-management/single-pages/${singlePageId}/content${query}`, token);
  }

  // preview content
  async previewContent(
    singlePageId: string,
    token: string,
    locale?: string
  ): Promise<ApiResponse> {
    const query = locale ? `?locale=${locale}` : '';
    return this.get(`/content-management/single-pages/${singlePageId}/preview${query}`, token);
  }

  // update single page content
  async updateSinglePageContent(
    pageId: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      content?: Record<string, any>;
      seo?: Record<string, any>;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(
      `/content-builder/single-pages/${pageId}/content`,
      data,
      token
    );
  }

  // delete single page content
  async deleteSinglePageContent(
    singlePageId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.delete(`/content-builder/single-pages/${singlePageId}/content`, token);
  }

  // CONTENT BUILDER ENTRIES (Multiple Page)
  // create entry
  async createEntry(
    multiplePageId: string,
    data: {
      data: any;
      locale?: string;
      published?: boolean;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/content-builder/multiple-pages/${multiplePageId}/entries`, data, token);
  }

  // get entries berdasarkan multiple page
  async getEntriesByMultiplePage(
    multiplePageId: string,
    token: string,
    params?: {
      locale?: string;
      published?: boolean;
    }
  ): Promise<ApiResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return this.get(`/content-builder/multiple-pages/${multiplePageId}/entries${queryString}`, token);
  }

  // get entry berdasarkan id
  async getEntryById(id: string, token: string): Promise<ApiResponse> {
    return this.get(`/content-builder/entries/${id}`, token);
  }

  // update entry
  async updateEntry(
    id: string,
    data: {
      data?: any;
      locale?: string;
      published?: boolean;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/content-builder/entries/${id}`, data, token);
  }

  // delete entry
  async deleteEntry(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/content-builder/entries/${id}`, token);
  }

  // toggle publish entry
  async togglePublishEntry(id: string, token: string): Promise<ApiResponse> {
    return this.patch(`/content-builder/entries/${id}/toggle-publish`, {}, token);
  }

  // bulk delete
  async bulkDeleteEntries(
    entryIds: string[],
    token: string
  ): Promise<ApiResponse> {
    return this.post('/content-builder/entries/bulk-delete', { entryIds }, token);
  }

  // MEDIA MANAGEMENT
  // upload media
  async uploadMedia(
    formData: FormData,
    token: string
  ): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/media/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    return this.handleResponse(response);
  }

  // get all media
  async getAllMedia(token: string, projectId?: string): Promise<ApiResponse> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.get(`/media${query}`, token);
  }

  // delete media
  async deleteMedia(filename: string, token: string): Promise<ApiResponse> {
    return this.delete(`/media/${filename}`, token);
  }

  // MEDIA ASSETS
  // upload media asset
  async uploadMediaAsset(
    organizationId: string,
    formData: FormData,
    token: string
  ): Promise<ApiResponse> {
    const response = await fetch(
      `${this.baseUrl}/organizations/${organizationId}/media-assets`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    return this.handleResponse(response);
  }

  // replace
  async replaceMediaAsset(
    organizationId: string,
    assetId: string,
    formData: FormData,
    token: string
  ) {
    return this.put(
      `/organizations/${organizationId}/media-assets/${assetId}`,
      formData,
      token
    );
  }

  // get all media assets
  async getAllMediaAssets(
    organizationId: string,
    token: string,
    params?: {
      folderId?: string;
      search?: string;
      sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileSize';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse> {
    let queryString = '';

    if (params) {
      const searchParams = new URLSearchParams();

      if (params.folderId) searchParams.append('folderId', params.folderId);
      if (params.search) searchParams.append('search', params.search);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());

      const query = searchParams.toString();
      if (query) queryString = `?${query}`;
    }

    return this.get(
      `/organizations/${organizationId}/media-assets${queryString}`,
      token
    );
  }

  // get media asset by ID
  async getMediaAssetById(
    organizationId: string,
    assetId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(
      `/organizations/${organizationId}/media-assets/${assetId}`,
      token
    );
  }

  // update media asset
  async updateMediaAsset(
    organizationId: string,
    assetId: string,
    data: {
      title?: string;
      description?: string;
      altText?: string;
      tags?: string[];
      language?: string;
      folderId?: string | null;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.patch(
      `/organizations/${organizationId}/media-assets/${assetId}`,
      data,
      token
    );
  }

  // delete media asset
  async deleteMediaAsset(
    organizationId: string,
    assetId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.delete(
      `/organizations/${organizationId}/media-assets/${assetId}`,
      token
    );
  }

  // bulk delete media assets
  async bulkDeleteMediaAssets(
    organizationId: string,
    assetIds: string[],
    token: string
  ): Promise<ApiResponse> {
    return this.post(
      `/organizations/${organizationId}/media-assets/bulk-delete`,
      { assetIds },
      token
    );
  }

  // MEDIA FOLDERS
  // get all folders
  async getAllMediaFolders(
    organizationId: string,
    token: string,
    params?: {
      parentId?: string;
      search?: string;
    }
  ): Promise<ApiResponse> {
    let queryString = '';

    if (params) {
      const searchParams = new URLSearchParams();

      if (params.parentId) searchParams.append('parentId', params.parentId);
      if (params.search) searchParams.append('search', params.search);

      const query = searchParams.toString();
      if (query) queryString = `?${query}`;
    }

    return this.get(
      `/organizations/${organizationId}/media-folders${queryString}`,
      token
    );
  }

  // get folder by ID
  async getMediaFolderById(
    organizationId: string,
    folderId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(
      `/organizations/${organizationId}/media-folders/${folderId}`,
      token
    );
  }

  // create folder
  async createMediaFolder(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      parentId?: string;
      color?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post(
      `/organizations/${organizationId}/media-folders`,
      data,
      token
    );
  }

  // update folder
  async updateMediaFolder(
    organizationId: string,
    folderId: string,
    data: {
      name?: string;
      description?: string;
      parentId?: string | null;
      color?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.patch(
      `/organizations/${organizationId}/media-folders/${folderId}`,
      data,
      token
    );
  }

  // delete folder
  async deleteMediaFolder(
    organizationId: string,
    folderId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.delete(
      `/organizations/${organizationId}/media-folders/${folderId}`,
      token
    );
  }


  // API TOKEN
  // create api token
  async createApiToken(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      validityPeriod: number;
      accessScope: 'FULL' | 'CUSTOM' | 'READ_ONLY';
      permissions?: Array<{
        resource: string;
        action: string;
      }>;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/organizations/${organizationId}/tokens`, data, token);
  }

  // get all api untuk organisasi
  async getApiTokens(organizationId: string, token: string): Promise<ApiResponse> {
    return this.get(`/organizations/${organizationId}/tokens`, token);
  }

  // get single api berdasarkan id
  async getApiTokenById(tokenId: string, token: string): Promise<ApiResponse> {
    return this.get(`/tokens/${tokenId}`, token);
  }

  // get usage logs 
  async getApiTokenUsageLogs(
    tokenId: string,
    params: { limit?: number; offset?: number },
    token: string
  ): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    return this.get(`/tokens/${tokenId}/usage-logs?${queryParams.toString()}`, token);
  }

  // update api token
  async updateApiToken(
    tokenId: string,
    data: {
      name?: string;
      description?: string;
      validityPeriod?: number;
      accessScope?: 'FULL' | 'CUSTOM' | 'READ_ONLY';
      permissions?: Array<{
        resource: string;
        action: string;
      }>;
      status?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.put(`/tokens/${tokenId}`, data, token);
  }

  // revoke api token
  async revokeApiToken(tokenId: string, token: string): Promise<ApiResponse> {
    return this.patch(`/tokens/${tokenId}/revoke`, {}, token);
  }

  // delete api token
  async deleteApiToken(tokenId: string, token: string): Promise<ApiResponse> {
    return this.delete(`/tokens/${tokenId}`, token);
  }

  // PLAN & BILLING
  // get plans
  async getAllPlans(isActive?: boolean): Promise<ApiResponse> {
    const query = isActive !== undefined ? `?isActive=${isActive}` : '';
    return this.get(`/plans${query}`);
  }

  // Get plan by ID
  async getPlanById(id: string): Promise<ApiResponse> {
    return this.get(`/plans/${id}`);
  }

  // Compare plans
  async comparePlans(planIds: string[]): Promise<ApiResponse> {
    const query = `?planIds=${planIds.join(',')}`;
    return this.get(`/plans/compare${query}`);
  }

  // SUBSCRIPTION
  // Create subscription with better validation
  async createSubscription(
    data: {
      organizationId: string;
      planId: string;
      billingCycle: 'MONTHLY' | 'YEARLY';
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post(`/organizations/${data.organizationId}/subscription`, data, token);
  }

  // Get current subscription
  async getCurrentSubscription(organizationId: string, token: string): Promise<ApiResponse> {
    return this.get(`/organizations/${organizationId}/subscription`, token);
  }

  // Upgrade subscription
  async upgradeSubscription(
    organizationId: string,
    newPlanId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.patch(
      `/organizations/${organizationId}/subscription/upgrade`,
      { newPlanId },
      token
    );
  }

  // Cancel subscription
  async cancelSubscription(organizationId: string, token: string): Promise<ApiResponse> {
    return this.patch(`/organizations/${organizationId}/subscription/cancel`, {}, token);
  }

  // BILLING ADDRESS
  // Create/Update billing address
  async createOrUpdateBillingAddress(
    data: {
      fullName: string;
      email: string;
      country: string;
      city: string;
      zipCode?: string;
      state: string;
      address: string;
      company?: string;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/billing-address', data, token);
  }

  // get billing
  async getBillingAddress(token: string): Promise<ApiResponse> {
    return this.get('/billing-address', token);
  }

  // PAYMENT METHOD
  // Add payment method
  async addPaymentMethod(
    data: {
      type: 'CREDIT_CARD' | 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'RETAIL' | 'PAYLATER' | 'QRIS';
      cardLastFour?: string;
      cardBrand?: string;
      walletProvider?: string;
      walletPhone?: string;
      isDefault?: boolean;
    },
    token: string
  ): Promise<ApiResponse> {
    return this.post('/payment-methods', data, token);
  }

  // Get all payment methods
  async getAllPaymentMethods(token: string): Promise<ApiResponse> {
    return this.get('/payment-methods', token);
  }

  // Set default payment method
  async setDefaultPaymentMethod(id: string, token: string): Promise<ApiResponse> {
    return this.patch(`/payment-methods/${id}/default`, {}, token);
  }

  // Delete payment method
  async deletePaymentMethod(id: string, token: string): Promise<ApiResponse> {
    return this.delete(`/payment-methods/${id}`, token);
  }

  // BILLING HISTORY
  // Get billing history with better pagination
  async getBillingHistory(
    organizationId: string,
    token: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<ApiResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return this.get(`/organizations/${organizationId}/billing-history${queryString}`, token);
  }

  // Download invoice
  async downloadInvoice(
    organizationId: string,
    invoiceId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(
      `/organizations/${organizationId}/billing-history/${invoiceId}/download`,
      token
    );
  }

  // USAGE
  // Get current usage
  async getCurrentUsage(
    organizationId: string,
    token: string
  ): Promise<ApiResponse> {
    return this.get(`/organizations/${organizationId}/usage`, token);
  }
}

export const api = new ApiService(API_URL);
export default api;
export interface MediaAsset {
  id: string;
  organizationId: string;
  folderId: string | null;
  uploadedById: string;
  title: string;
  description: string | null;
  altText: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  tags: string[];
  language: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  
  folder?: MediaFolder;
  uploadedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface MediaFolder {
  id: string;
  organizationId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  color: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  
  _count?: {
    assets: number;
    subfolders: number;
  };
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface MediaAssetsResponse {
  success: boolean;
  message: string;
  data: {
    assets: MediaAsset[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

export interface MediaAssetResponse {
  success: boolean;
  message: string;
  data: MediaAsset;
}

export interface MediaFoldersResponse {
  success: boolean;
  message: string;
  data: MediaFolder[];
}

export interface MediaFolderResponse {
  success: boolean;
  message: string;
  data: MediaFolder;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  data: {
    deletedCount: number;
  };
}

export interface GetMediaAssetsParams {
  folderId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  page?: string | number;
  limit?: string | number;
}

export interface GetMediaFoldersParams {
  parentId?: string;
  search?: string;
}
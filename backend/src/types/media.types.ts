import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        fullName: string;
    };
}

// jenis media aset
export interface MediaAsset {
    id: string;
    organizationId: string;
    folderId: string | null;
    uploadedById: number;
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
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface MediaAssetWithRelations extends MediaAsset {
    folder?: MediaFolder | null;
    uploadedBy?: {
        id: number;
        fullName: string;
        email: string;
    };
}

export interface CreateMediaAssetInput {
    organizationId: string;
    folderId?: string | null;
    uploadedById: number;
    title: string;
    description?: string | null;
    altText?: string | null;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    extension: string;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    tags?: string[];
    language?: string;
}

export interface UpdateMediaAssetInput {
    title?: string;
    description?: string | null;
    altText?: string | null;
    tags?: string[];
    language?: string;
    folderId?: string | null;
}

// jenis folder
export interface MediaFolder {
    id: string;
    organizationId: string;
    parentId: string | null;
    name: string;
    description: string | null;
    color: string | null;
    createdById: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface MediaFolderWithRelations extends MediaFolder {
    parent?: MediaFolder | null;
    subfolders?: MediaFolder[];
    assets?: MediaAsset[];
    createdBy?: {
        id: number;
        fullName: string;
        email: string;
    };
    _count?: {
        assets: number;
        subfolders: number;
    };
}

export interface CreateMediaFolderInput {
    organizationId: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    color?: string | null;
    createdById: number;
}

export interface UpdateMediaFolderInput {
    name?: string;
    description?: string | null;
    parentId?: string | null;
    color?: string | null;
}

// jenis parameter
export interface GetMediaAssetsQuery {
    folderId?: string;
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileSize';
    sortOrder?: 'asc' | 'desc';
    page?: string;
    limit?: string;
}

export interface GetMediaFoldersQuery {
    parentId?: string;
    search?: string;
}

// jenis unggahan
export interface UploadResult {
    url: string;
    width?: number;
    height?: number;
    duration?: number;
}

// jenis resons API
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: {
        assets?: T[];
        folders?: T[];
        pagination: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    };
}

export interface BulkDeleteInput {
    assetIds: string[];
}

export interface BulkDeleteResponse {
    deletedCount: number;
}

// pemeriksaan anggota organisasi
export interface OrganizationAccess {
    isOwner: boolean;
    isMember: boolean;
    hasAccess: boolean;
}

// konfigurasi unggah file
export interface FileUploadConfig {
    maxFileSize: number; // in bytes
    maxFiles: number;
    allowedMimeTypes: string[];
}

// konfigurasi penyimpanan
export interface StorageConfig {
    provider: 'S3' | 'GCS' | 'AZURE' | 'LOCAL';
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}
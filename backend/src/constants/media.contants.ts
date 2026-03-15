export const ALLOWED_IMAGES: string[] = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];

export const ALLOWED_VIDEOS: string[] = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
];

export const ALLOWED_AUDIO: string[] = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
];

export const ALLOWED_DOCUMENTS: string[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// semua tipe MIME yang diizinkan
export const ALL_ALLOWED_MIME_TYPES: string[] = [
    ...ALLOWED_IMAGES,
    ...ALLOWED_VIDEOS,
    ...ALLOWED_AUDIO,
    ...ALLOWED_DOCUMENTS,
];

// batasan ukuran file dlam byte
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_FILES_PER_UPLOAD = 10;

// pengaturan kompresi gambar
export const IMAGE_COMPRESSION_THRESHOLD = 1024 * 1024; // 1MB
export const IMAGE_MAX_WIDTH = 2048;
export const IMAGE_MAX_HEIGHT = 2048;
export const IMAGE_QUALITY = 85;

// default penomoran halaman
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// default
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_FOLDER_COLOR = '#3498db';

// sort options
export const VALID_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'fileSize'] as const;
export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

export const MEDIA_CONSTANTS = {
    MAX_FILE_SIZE,
    MAX_FILES_PER_UPLOAD,
    IMAGE_COMPRESSION_THRESHOLD,
    IMAGE_MAX_WIDTH,
    IMAGE_MAX_HEIGHT,
    IMAGE_QUALITY,
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    DEFAULT_LANGUAGE,
    DEFAULT_FOLDER_COLOR,
    ALLOWED_MIME_TYPES: {
        IMAGES: ALLOWED_IMAGES,
        VIDEOS: ALLOWED_VIDEOS,
        AUDIO: ALLOWED_AUDIO,
        DOCUMENTS: ALLOWED_DOCUMENTS,
        ALL: ALL_ALLOWED_MIME_TYPES,
    },
    VALID_SORT_FIELDS,
    VALID_SORT_ORDERS,
};

export type MimeTypeCategory = 'image' | 'video' | 'audio' | 'document';
export type SortField = typeof VALID_SORT_FIELDS[number];
export type SortOrder = typeof VALID_SORT_ORDERS[number];

// helper untuk mendapatkan kategori tipe MIME
export function getMimeTypeCategory(mimeType: string): MimeTypeCategory | null {
    if (ALLOWED_IMAGES.includes(mimeType)) return 'image';
    if (ALLOWED_VIDEOS.includes(mimeType)) return 'video';
    if (ALLOWED_AUDIO.includes(mimeType)) return 'audio';
    if (ALLOWED_DOCUMENTS.includes(mimeType)) return 'document';
    return null;
}

// helper untuk memeriksa apakah tipe MIME diizinkan atau tidak
export function isAllowedMimeType(mimeType: string): boolean {
    return ALL_ALLOWED_MIME_TYPES.includes(mimeType);
}

// helper untuk memvalidasi ekstensi file
export function isValidFileExtension(filename: string, mimeType: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return false;
    
    const mimeToExtension: Record<string, string[]> = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/gif': ['gif'],
        'image/webp': ['webp'],
        'image/svg+xml': ['svg'],
        'video/mp4': ['mp4'],
        'video/mpeg': ['mpeg', 'mpg'],
        'video/quicktime': ['mov'],
        'video/x-msvideo': ['avi'],
        'video/webm': ['webm'],
        'audio/mpeg': ['mp3'],
        'audio/wav': ['wav'],
        'audio/ogg': ['ogg'],
        'application/pdf': ['pdf'],
        'application/msword': ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    };
    
    const allowedExtensions = mimeToExtension[mimeType];
    return allowedExtensions ? allowedExtensions.includes(extension) : false;
}

// helper untu memformat ukuran file
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// helper untuk generate API ID 
export function generateApiId(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// validasi helpers
export function validatePagination(page?: string, limit?: string) {
    const pageNum = page ? parseInt(page) : DEFAULT_PAGE;
    const limitNum = limit ? parseInt(limit) : DEFAULT_LIMIT;
    
    return {
        page: Math.max(1, pageNum),
        limit: Math.min(MAX_LIMIT, Math.max(1, limitNum)),
    };
}

export function validateSortParams(sortBy?: string, sortOrder?: string) {
    const validSortBy = VALID_SORT_FIELDS.includes(sortBy as any)
        ? (sortBy as SortField)
        : 'createdAt';
    
    const validSortOrder = VALID_SORT_ORDERS.includes(sortOrder as any)
        ? (sortOrder as SortOrder)
        : 'desc';
    
    return { sortBy: validSortBy, sortOrder: validSortOrder };
}

// mendapatkan ekstensi file dari namanya
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

// mengecek jika file berupa gambar
export function isImageFile(mimeType: string): boolean {
    return ALLOWED_IMAGES.includes(mimeType);
}

// mengecek jika file berupa audio
export function isVideoFile(mimeType: string): boolean {
    return ALLOWED_VIDEOS.includes(mimeType);
}

// mengecek jika file berupa audio
export function isAudioFile(mimeType: string): boolean {
    return ALLOWED_AUDIO.includes(mimeType);
}

// mengecek jika file berupa dokumen
export function isDocumentFile(mimeType: string): boolean {
    return ALLOWED_DOCUMENTS.includes(mimeType);
}

export function getFileTypeName(mimeType: string): string {
    const category = getMimeTypeCategory(mimeType);
    if (!category) return 'Unknown';
    
    const typeNames: Record<MimeTypeCategory, string> = {
        image: 'Image',
        video: 'Video',
        audio: 'Audio',
        document: 'Document',
    };
    
    return typeNames[category];
}
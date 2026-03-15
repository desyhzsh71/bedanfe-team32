import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResult {
  url: string;
  width?: number;
  height?: number;
  duration?: number;
}

export async function uploadToCloudStorage(
    file: Express.Multer.File,
    organizationId: string
): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: `uploads/${organizationId}` },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve({
                    url: result.secure_url,
                    width: result.width,
                    height: result.height,
                });
            }
        );
        uploadStream.end(file.buffer);
    });
}

export async function deleteFromCloudStorage(fileUrl: string): Promise<void> {
    try {
        const parts = fileUrl.split('/');
        const publicId = parts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}
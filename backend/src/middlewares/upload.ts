import multer from 'multer';
import { ALL_ALLOWED_MIME_TYPES, MAX_FILE_SIZE, isAllowedMimeType } from "../constants/media.contants";

// konfigurasi untuk penyimpanan memori
const storage = multer.memoryStorage();

// file filter
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (isAllowedMimeType(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not supported. Allowed types: ${ALL_ALLOWED_MIME_TYPES.join(', ')}`), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});
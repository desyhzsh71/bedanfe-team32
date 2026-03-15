import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import multer from "multer";
import path from "path";
import fs from 'fs';
import { date, success } from "zod";
import { fa } from "zod/v4/locales";
import { size } from "pdfkit/js/page";
import { url } from "inspector";

// konfigurasi mulyer untuk upload
const storage = multer.diskStorage({
    destination(req, file, callback) {
        const uploadDir = 'uploads/media';

        // create drectory jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        callback(null, uploadDir);
    },
    filename(req, file, callback) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req: any, file: any, callback: any) => {
    // jenis file yang diperbolehkan
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback(new Error('Invalid file type. Only images, videos, and documents are allowed'));
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter,
});

// post media (upload media)
export async function uploadMedia(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { projectId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        // mengecek akses ke project (pakai projectId)
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                include: {
                    collaborators: {
                        where: {
                            userId, status: 'ACTIVE',
                        },
                    },
                },
            });
            if (!project) {
                // delete file yang diupload
                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    success: false,
                    message: 'Project not found',
                });
            }

            const isOwner = project.createdBy === userId;
            const isCollaborator = project.collaborators.length > 0;

            if (!isOwner && !isCollaborator) {
                // delete file yang diupload
                fs.unlinkSync(req.file.path);

                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to access this project',
                });
            }
        }

        // generate public URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const fileUrl = `${baseUrl}/${req.file.path.replace(/\\/g, '/')}`;

        // 
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl,
                path: req.file.path,
            },
        });
    } catch (error) {
        console.error('Upoad media error:', error);

        // delete file yang diupload jika error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
        });
    }
}

// get all media library
export async function getAllMedia(req: Request, res: Response) {
    try {
        const { projectId } = req.query;
        const uploadDir = 'uploads/media';
        
        // mengecek apakah direktori ada atau tidak
        if (!fs.existsSync(uploadDir)) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        // baca semua file yang ada di direktori
        const files = fs.readdirSync(uploadDir);
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

        const mediaList = files.map((filename) => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);

            return {
                filename,
                url: `${baseUrl}/${uploadDir}/${filename}`,
                size: stats.size,
                createdAt: stats.birthtime,
            };
        });

        // urutkan berdasarkan yang terbaru
        mediaList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        res.status(200).json({
            success: true,
            data: mediaList,
        });
    } catch (error) {
        console.error('Get all media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get media',
        });
    }
}

// delete media
export async function deleteMedia(req: Request, res: Response) {
    try {
        const { filename } = req.params;
        const filePath = path.join('uploads/media', filename);

        // mengecek apakah file ada atau tidak
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
            });
        }

        // delete file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
        });
    }
}
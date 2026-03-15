import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { da, tr } from "zod/v4/locales";
import { success } from "zod";

// single page
// create-update single page content
export async function upsertSinglePageContent(req: Request, res: Response) {
    try {
        const { singlePageId } = req.params;
        const { data, locale = 'en' } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Data is required',
            });
        }

        // mengecek apakah project ada atau tidak
        const singlePage = await prisma.singlePage.findUnique({
            where: { id: singlePageId },
            include: {
                fields: true,
            },
        });

        if (!singlePage) {
            return res.status(404).json({
                success: false,
                message: 'Single page not found',
            });
        }

        // validasi fields yang diperlukan
        const requiredFields = singlePage.fields.filter((f) => f.required);
        const missingFields = requiredFields.filter(
            (field) => !data[field.apiId] || data[field.apiId] === ''
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields.map((f) => f.apiId),
            });
        }

        const content = await prisma.singlePageContent.upsert({
            where: { singlePageId },
            update: { data, locale },
            create: { singlePageId, data, locale },
        });

        res.status(200).json({
            success: true,
            message: 'Single page content saved successfully',
            data: content,
        });
    } catch (error) {
        console.error('Upsert single page content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save single page content',
        });
    }
}

// get single page content
export async function getSinglePageContent(req: Request, res: Response) {
    try {
        const { singlePageId } = req.params;
        const { locale } = req.query;

        const whereClause: any = { singlePageId };
        if (locale) {
            whereClause.locale = locale as string;
        }

        const content = await prisma.singlePageContent.findFirst({
            where: whereClause,
            include: {
                singlePage: {
                    include: {
                        fields: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found',
            });
        }

        res.status(200).json({
            success: true,
            data: content,
        });
    } catch (error) {
        console.error('Get single page content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch single page content',
        });
    }
}

// delete single page content
export async function deleteSinglePageContent(req: Request, res: Response) {
    try {
        const { singlePageId } = req.params;

        const content = await prisma.singlePageContent.findUnique({
            where: { singlePageId },
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found',
            });
        }

        await prisma.singlePageContent.delete({
            where: { singlePageId },
        });

        res.status(200).json({
            success: true,
            message: 'Single page content deleted successfully',
        });
    } catch (error) {
        console.error('Delete singe page content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete single page content',
        });
    }
}

// multiple page entry
// cretae multiple page entry
export async function createEntry(req: Request, res: Response) {
    try {
        const { multiplePageId } = req.params;
        const { data, locale = 'en', published = false } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Data is required',
            });
        }

        // mengecek apakah project ada atau tidak
        const multiplePage = await prisma.multiplePage.findUnique({
            where: { id: multiplePageId },
            include: {
                fields: true,
            },
        });

        if (!multiplePage) {
            return res.status(404).json({
                success: false,
                message: 'Multiple page not found',
            });
        }

        // validasi fields yang diperlukan
        const requiredFields = multiplePage.fields.filter((f) => f.required);
        const missingFields = requiredFields.filter(
            (field) => !data[field.apiId] || data[field.apiId] === ''
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields.map((f) => f.apiId),
            });
        }

        // create entry
        const entry = await prisma.multiplePageEntry.create({
            data: { multiplePageId, data, locale, published },
        });

        res.status(200).json({
            success: true,
            message: 'Entry created successfully',
            data: entry,
        });
    } catch (error) {
        console.error('Creatte entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create entry',
        });
    }
}

// get all entry berdasarkan multiple page
export async function getAllEntries(req: Request, res: Response) {
    try {
        const { multiplePageId } = req.params;
        const { locale, published } = req.query;

        const whereClause: any = { multiplePageId };
        if (locale) whereClause.locale = locale as string;
        if (published !== undefined) whereClause.published = published === 'true';

        const entries = await prisma.multiplePageEntry.findMany({
            where: whereClause,
            include: {
                multiplePage: {
                    include: {
                        fields: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: entries,
        });
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entries',
        });
    }
}

// get entry berdasarkan id
export async function getEntrybyId(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const entry = await prisma.multiplePageEntry.findUnique({
            where: { id },
            include: {
                multiplePage: {
                    include: {
                        fields: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found',
            });
        }

        res.status(200).json({
            success: true,
            data: entry,
        });
    } catch (error) {
        console.error('Get entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entry',
        });
    }
}

// update entry
export async function updateEntry(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { data, locale, published } = req.body;

        const entry = await prisma.multiplePageEntry.findUnique({
            where: { id },
            include: {
                multiplePage: {
                    include: { fields: true },
                },
            },
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found',
            });
        }

        // validasi fields yang diperlukan
        if (data) {
            const requiredFields = entry.multiplePage.fields.filter((f) => f.required);
            const missingFields = requiredFields.filter(
                (field) => !data[field.apiId] || data[field.apiId] === ''
            );

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                    missingFields: missingFields.map((f) => f.apiId),
                });
            }
        }

        const updatedEntry = await prisma.multiplePageEntry.update({
            where: { id },
            data: {
                ...(data && { data }),
                ...(locale && { locale }),
                ...(published !== undefined&& { published }),  
            },
        });

        res.status(200).json({
            success: true,
            message: 'Entry updated successfully',
            data: updatedEntry,
        });
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update entry',
        });
    }
}

// delete entry
export async function deleteEntry(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const entry = await prisma.multiplePageEntry.findUnique({
            where: { id },
        });
        
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found',
            });
        }

        await prisma.multiplePageEntry.delete({
            where: { id },
        });

        res.status(200).json({
            success: true, 
            message: 'Entry deleted successfully',
        });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete entry',
        });
    }
}

// publish/unpublish entry
export async function togglePublishEntry(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const entry = await prisma.multiplePageEntry.findUnique({
            where: { id },
        });

        if (!entry) { 
            return res.status(404).json({
                success: false,
                message: 'Entry not found',
            });
        }

        const updatedEntry = await prisma.multiplePageEntry.update({
            where: { id },
            data: { published: !entry.published },
        });

        res.status(200).json({
            success: true,
            message: `Entry ${updatedEntry.published ? 'published' : 'unpublished'} successfully`,
            data: updatedEntry,
        });
    } catch (error) {
        console.error('Toggle publish entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle publish status',
        });
    }
}

// delete entry
export async function bulkDeleteEntries(req: Request, res: Response) {
    try {
        const { entryIds } = req.body;

        if (!Array.isArray(entryIds) || entryIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid entry IDs array',
            });
        }

        await prisma.multiplePageEntry.deleteMany({
            where: { id: { in: entryIds }, },
        });

        res.status(200).json({
            success: true, 
            message: `${entryIds.length} entries deleted successfully`,
        });
    } catch (error) {
        console.error('Bulk delete entries error:', error);
        res.status(500).json({
            success: false, 
            message: 'Failed to bulk delete entries',
        });
    }
}
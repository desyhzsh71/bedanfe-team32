import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { success } from "zod";
import { FieldType } from "../../generated";
import { fa, fi, id, tr } from "zod/v4/locales";
import { required } from "zod/v4/core/util.cjs";
import { options } from "pdfkit";

// get konten untuk single page
export async function getContentStructure(req: Request, res: Response) {
    try {
        const { singlePageId } = req.params;
        const userId = req.user?.id;

        // get single page dengan field dan komponen
        const singlePage = await prisma.singlePage.findUnique({
            where: { id: singlePageId },
            include: {
                project: {
                    include: {
                        collaborators: {
                            where: {
                                userId, status: 'ACTIVE',
                            },
                        },
                    },
                },
                fields: {
                    orderBy: { order: 'asc' },
                },
                content: true,
            },
        });

        if (!singlePage) {
            return res.status(404).json({
                success: false,
                message: 'Single page not found',
            });
        }

        // mengecek akses untuk masuk ke project
        const isOwner = singlePage.project.createdBy === userId;
        const isCollaborator = singlePage.project.collaborators.length > 0;

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this project',
            });
        }

        // get components yang dipakai di fileds (ini untuk tipe multiple content)
        const componentFields = singlePage.fields.filter(
            (field) => field.type === 'MULTIPLE_CONTENT'
        );

        const componentStructures = await Promise.all(
            componentFields.map(async (field) => {
                // mengambil component ID dari option field
                const componentIds = field.options
                    ? (field.options as any).allowedComponents || [] : [];

                // get detail component
                const components = await prisma.component.findMany({
                    where: {
                        id: { in: componentIds },
                        projectId: singlePage.projectId,
                    },
                    include: {
                        fields: {
                            orderBy: { order: 'asc' },
                        },
                    },
                });

                return {
                    fieldId: field.id,
                    fieldApiId: field.apiId,
                    fieldName: field.name,
                    components,
                };
            })
        );

        // respon struktur
        const structure = {
            singlePage: {
                id: singlePage.id,
                name: singlePage.name,
                apiId: singlePage.apiId,
                seoEnabled: singlePage.seoEnabled,
            },
            field: singlePage.fields.map((field) => ({
                id: field.id,
                name: field.name,
                apiId: field.apiId,
                type: field.type,
                required: field.required,
                unique: field.unique,
                order: field.order,
                validations: field.validations,
                defaultValue: field.defaultValue,
                options: field.options,
            })),
            componentStructures,
            currentContent: singlePage.content?.data || {},
        };

        res.status(200).json({
            success: true,
            data: structure,
        });
    } catch (error) {
        console.error('Get content structure error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content structure',
        });
    }
}

// save content termasuk component seperti header, footer
export async function saveContent(req: Request, res: Response) {
    try {
        const { singlePageId } = req.params;
        const { data, locale = 'en' } = req.body;
        const userId = req.user?.id;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Data is required',
            });
        }

        // get single page dengan fields
        const singlePage = await prisma.singlePage.findUnique({
            where: { id: singlePageId },
            include: {
                fields: true,
                project: {
                    include: {
                        collaborators: {
                            where: { userId, status: 'ACTIVE' },
                        },
                    },
                },
            },
        });

        if (!singlePage) {
            return res.status(404).json({
                success: false,
                message: 'Single page not found',
            });
        }

        // mengecek akses untuk masuk ke project
        const isOwner = singlePage.project.createdBy === userId;
        const isCollaborator = singlePage.project.collaborators.length > 0;

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this project',
            });
        }

        // validasi 
        const requiredFields = singlePage.fields.filter((f) => f.required);
        const missingFields = requiredFields.filter(
            (field) => !data[field.apiId] || data[field.apiId] === ''
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields.map((f) => ({
                    apiId: f.apiId,
                    name: f.name,
                })),
            });
        }

        // validasi untuk field tipe multiple content
        const componentFields = singlePage.fields.filter(
            (f) => f.type === 'MULTIPLE_CONTENT'
        );

        for (const field of componentFields) {
            const fieldData = data[field.apiId];

            if (Array.isArray(fieldData)) {
                // validasi setiap component
                for (const componentInstance of fieldData) {
                    const componentId = componentInstance.componentId;

                    // get definition component
                    const component = await prisma.component.findUnique({
                        where: { id: componentId },
                        include: { fields: true },
                    });

                    if (!component) {
                        return res.status(400).json({
                            success: false,
                            message: 'Component not found: ${componentId}',
                        });
                    }

                    // validasi fields yang diperlukan component
                    const requiredComponentFields = component.fields.filter((f) => f.required);
                    const missingComponentFields = requiredComponentFields.filter(
                        (f) => !componentInstance.data[f.apiId]
                    );

                    if (missingComponentFields.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Missing required fields in component: ${component.name}',
                            missingFields: missingComponentFields.map((f) => ({
                                component: component.name,
                                field: f.name,
                            })),
                        });
                    }
                }
            }
        }

        // save content
        const content = await prisma.singlePageContent.upsert({
            where: { singlePageId },
            update: { data, locale },
            create: { singlePageId, data, locale },
        });

        res.status(200).json({
            success: true,
            messafe: 'Content saved succesfully',
            data: content,
        });
    } catch (error) {
        console.error('Save content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save content',
        });
    }
}

// get content terbaru untuk edit
export async function getCurrentContent(req: Request, res: Response) {
    try {
        const { singlePageId } = req.params;
        const { locale } = req.query;
        const userId = req.user?.id;

        const content = await prisma.singlePageContent.findFirst({
            where: {
                singlePageId,
                ...(locale && { locale: locale as string }),
            },
            include: {
                singlePage: {
                    include: {
                        fields: {
                            orderBy: { order: 'asc' },
                        },
                        project: {
                            include: {
                                collaborators: {
                                    where: { userId, status: 'ACTIVE' },
                                },
                            },
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

        // mengecek akses untuk masuk ke content
        const isCreator = content.singlePage.project.createdBy === userId;
        const isCollaborator = content.singlePage.project.collaborators.length > 0;

        if (!isCreator && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this content',
            });
        }

        res.status(200).json({
            success: true,
            data: content,
        });
    } catch (error) {
        console.error('Get current content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content',
        });
    }
}

// get preview content
export async function previewContent(req: Request, res: Response) {
    try {
        const { singlePageId } = req.params;
        const { locale = 'en' } = req.query;

        const content = await prisma.singlePageContent.findFirst({
            where: {
                singlePageId,
                locale: locale as string,
            },
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

        // format content untuk display
        const formattedContent: any = {
            meta: {
                pageName: content.singlePage.name,
                apiId: content.singlePage.apiId,
                locale: content.locale,
            },
            content: {},
        };

        // content data ke fields
        for (const field of content.singlePage.fields) {
            const fieldData = (content.data as any)[field.apiId];

            if (field.type === 'MULTIPLE_CONTENT' && Array.isArray(fieldData)) {
                // expand components
                formattedContent.content[field.apiId] = await Promise.all(
                    fieldData.map(async (instance: any) => {
                        const component = await prisma.component.findUnique({
                            where: { id: instance.componentId },
                            include: { fields: true },
                        });

                        return {
                            componentName: component?.name,
                            componentApiId: component?.apiId,
                            data: instance.data,
                        };
                    })
                );
            } else {
                formattedContent.content[field.apiId] = fieldData;
            }
        }

        res.status(200).json({
            success: true,
            data: formattedContent,
        });
    } catch (error) {
        console.error('Preview content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to preview content',
        });
    }
}
import { Request, Response } from "express";
import { FieldType } from "../../generated";
import { generateApiId } from "../../utils/generateApiId";
import prisma from "../../utils/prisma";

const fieldTypeMapping: Record<string, FieldType> = {
    'text': FieldType.TEXT,
    'textarea': FieldType.TEXT,           
    'richtext': FieldType.RICH_TEXT,      
    'media': FieldType.MEDIA,
    'number': FieldType.NUMBER,
    'date': FieldType.DATE_TIME,          
    'select': FieldType.SELECT,
    'relation': FieldType.RELATION,
    'boolean': FieldType.BOOLEAN,
    'json': FieldType.JSON,
};

// create field
export async function createField(req: Request, res: Response) {
    try {
        const { name, apiId, type, required = false, unique = false, singlePageId,
            multiplePageId, componentId, validations, defaultValue, options,
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false, 
                message: 'Name is required',
            });
        }

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Type is required',
            });
        }

        const prismaType = fieldTypeMapping[type.toLowerCase()];
        if (!prismaType) {
            return res.status(400).json({
                success: false,
                message: `Invalid field type: ${type}. Supported types: ${Object.keys(fieldTypeMapping).join(', ')}`,
            });
        }
        
        // harus ada salah satu
        if (!singlePageId && !multiplePageId && !componentId) {
            return res.status(400).json({
                success: false,
                message: 'Field must belong to either SinglePage, MultiplePage, or Component',
            });
        }

        // tidak boleh dari satu
        const parentCount = [singlePageId, multiplePageId, componentId].filter(Boolean).length;
        if (parentCount > 1) {
            return res.status(400).json({
                success: false,
                message: 'Field can only belong to one parent',
            });
        }

        // generate apiId
        const finalApiId = apiId || generateApiId(name);

        const maxOrderField = await prisma.field.findFirst({
            where: {
                ...(singlePageId && { singlePageId }),
                ...(multiplePageId && { multiplePageId }),
                ...(componentId && { componentId }),
            },
            orderBy: { order: 'desc' },
        });

        const nextOrder = maxOrderField ? maxOrderField.order + 1 : 0;

        const field = await prisma.field.create({
            data: {
                name,
                apiId: finalApiId,
                type: prismaType,
                required,
                unique,
                order: nextOrder,
                ...(singlePageId && { singlePageId }),
                ...(multiplePageId && { multiplePageId }),
                ...(componentId && { componentId }),
                ...(validations && { validations }),
                ...(defaultValue && { defaultValue }),
                ...(options && { options }),
            },
        });

        res.status(201).json({
            success: true,
            message: 'Field created successfully',
            data: field,
        });
    } catch (error) {
        console.error('Create field error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create field',
        });
    }
}

// get all fields berdasarkan parent
export async function getAllFieldsByParent(req: Request, res: Response) {
    try {
        const { parentType, parentId } = req.params;

        let whereClause: any = {};

        switch (parentType) {
            case 'single-page':
                whereClause = { singlePageId: parentId };
                break;
            case 'multiple-page':
                whereClause = { multiplePageId: parentId };
                break;
            case 'component':
                whereClause = { componentId: parentId };
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid parent type',
                });
        }

        const fields = await prisma.field.findMany({
            where: whereClause,
            orderBy: { order: 'asc' },
        });

        res.status(200).json({
            success: true,
            data: fields,
        });
    } catch (error) {
        console.error('Get fields error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fields',
        });
    }
}

// get field berdasarkan id
export async function getFieldById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const field = await prisma.field.findUnique({
            where: { id },
            include: {
                singlePage: {
                    select: { id: true, name: true },
                },
                multiplePage: {
                    select: { id: true, name: true },
                },
                component: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Field not found',
            });
        }

        res.status(200).json({
            success: true,
            data: field,
        });
    } catch (error) {
        console.error('Get field error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch field',
        });
    }
}

// update field
export async function updateField(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, apiId, type, required,
            unique, validations, defaultValue, options,
        } = req.body;

        const field = await prisma.field.findUnique({
            where: { id },
        });

        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Field not found',
            });
        }

        let prismaType: FieldType | undefined;
        if (type) {
            prismaType = fieldTypeMapping[type.toLowerCase()];
            if (!prismaType) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid field type: ${type}. Supported types: ${Object.keys(fieldTypeMapping).join(', ')}`,
                });
            }
        }

        const updatedField = await prisma.field.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(apiId && { apiId }),
                ...(prismaType && { type: prismaType }), 
                ...(required !== undefined && { required }),
                ...(unique !== undefined && { unique }),
                ...(validations !== undefined && { validations }),
                ...(defaultValue !== undefined && { defaultValue }),
                ...(options !== undefined && { options }),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Field updated successfully',
            data: updatedField,
        });
    } catch (error) {
        console.error('Update field error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update field',
        });
    }
}

// delete field
export async function deleteField(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const field = await prisma.field.findUnique({
            where: { id },
        });

        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Field not found',
            });
        }

        await prisma.field.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Field deleted successfully',
        });
    } catch (error) {
        console.error('Delete field error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete field',
        });
    }
}

// reorder fields
export async function reorderFields(req: Request, res: Response) {
    try {
        const { fieldIds } = req.body;

        if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid field IDs array',
            });
        }

        // update order untuk setiap fieldnya
        const updatePromises = fieldIds.map((fieldId, index) =>
            prisma.field.update({
                where: { id: fieldId },
                data: { order: index },
            })
        );

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: 'Fields reordered successfully',
        });
    } catch (error) {
        console.error('Reorder fields error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder fields',
        });
    }
}

// duplicate field
export async function duplicateField(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const field = await prisma.field.findUnique({
            where: { id },
        });

        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Field not found',
            });
        }

        // get current
        const maxOrderField = await prisma.field.findFirst({
            where: {
                ...(field.singlePageId && { singlePageId: field.singlePageId }),
                ...(field.multiplePageId && { multiplePageId: field.multiplePageId }),
                ...(field.componentId && { componentId: field.componentId }),
            },
            orderBy: { order: 'desc' },
        });

        const nextOrder = maxOrderField ? maxOrderField.order + 1 : 0;

        // create duplicate
        const duplicatedField = await prisma.field.create({
            data: {
                name: `${field.name} (Copy)`,
                apiId: `${field.apiId}_copy_${Date.now()}`,
                type: field.type,
                required: field.required,
                unique: false, // harus false untuk duplicate
                order: nextOrder,
                ...(field.singlePageId && { singlePageId: field.singlePageId }),
                ...(field.multiplePageId && { multiplePageId: field.multiplePageId }),
                ...(field.componentId && { componentId: field.componentId }),
                ...(field.validations && { validations: field.validations }),
                ...(field.defaultValue && { defaultValue: field.defaultValue }),
                ...(field.options && { options: field.options }),
            },
        });

        res.status(201).json({
            success: true,
            message: 'Field duplicated successfully',
            data: duplicatedField,
        });
    } catch (error) {
        console.error('Duplicate field error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to duplicate field',
        });
    }
}
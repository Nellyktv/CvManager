import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import { ApiError } from '../errors/ApiError.js';
import { Attribute } from '../models/models.js';

interface AttributeBody {
    name?: string;
    description?: string | null;
    type?: string;
    options?: string | null;
}

const createAttribute = async (req: Request, res: Response) => {
    const { name, description, type, options }: AttributeBody = req.body;

    if (!name || !type) {
        throw ApiError.badRequest('Name and type are required');
    }

    const existingAttribute = await Attribute.findOne({
        where: { name },
    });

    if (existingAttribute) {
        throw ApiError.badRequest(
            'An attribute with this name already exists'
        );
    }

    const attribute = await Attribute.create({
        name,
        description: description ?? null,
        type,
        options: options ?? null,
    });

    return res.json({ attribute });
};

const getAllAttributes = async (_req: Request, res: Response) => {
    const attributes = await Attribute.findAll();

    return res.json({
        allAttributes: attributes,
    });
};

const getAttribute = async (req: Request<IdParams>, res: Response) => {
    const { id } = req.params;

    const attribute = await Attribute.findByPk(id);

    if (!attribute) {
        throw ApiError.notFound('Attribute not found');
    }

    return res.json({
        attribute,
    });
};

const updateAttribute = async (req: Request<IdParams>, res: Response) => {
    const { id } = req.params;
    const { name, description, type, options }: AttributeBody = req.body;

    const attribute = await Attribute.findByPk(id);

    if (!attribute) {
        throw ApiError.notFound('Attribute not found');
    }

    await attribute.update({
        name,
        description,
        type,
        options,
    });

    return res.json({
        message: 'Attribute updated',
    });
};

const deleteAttribute = async (req: Request<IdParams>, res: Response) => {
    const { id } = req.params;

    const attribute = await Attribute.findByPk(id);

    if (!attribute) {
        throw ApiError.notFound('Attribute not found');
    }

    await attribute.destroy();

    return res.json({
        message: 'Attribute deleted',
    });
};

export default {
    createAttribute,
    getAllAttributes,
    getAttribute,
    updateAttribute,
    deleteAttribute,
};

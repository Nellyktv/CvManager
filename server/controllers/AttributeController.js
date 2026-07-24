import { ApiError } from '../errors/ApiError.js';
import { Attribute } from '../models/models.js';

const createAttribute = async (req, res) => {
    const { name, description, type, options } = req.body;

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
        description,
        type,
        options,
    });

    return res.json({ attribute });
};

const getAllAttributes = async (req, res) => {
    const attributes = await Attribute.findAll();

    return res.json({
        allAttributes: attributes,
    });
};

const getAttribute = async (req, res) => {
    const { id } = req.params;

    const attribute = await Attribute.findByPk(id);

    if (!attribute) {
        throw ApiError.notFound('Attribute not found');
    }

    return res.json({
        attribute,
    });
};

const updateAttribute = async (req, res) => {
    const { id } = req.params;
    const { name, description, type, options } = req.body;

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

const deleteAttribute = async (req, res) => {
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
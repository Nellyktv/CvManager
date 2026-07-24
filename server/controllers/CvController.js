import { ApiError } from '../errors/ApiError.js';
import {
    Cv,
    Position,
    Attribute,
    CandidateSkills,
    User,
    Project,
} from '../models/models.js';

const createCv = async (req, res) => {
    const { positionId } = req.body;

    if (!positionId) {
        throw ApiError.badRequest('positionId is required');
    }

    const cv = await Cv.create({
        positionId,
        userId: req.user.id,
    });

    return res.json({ cv });
};

const getCv = async (req, res) => {
    const { id } = req.params;

    if (isNaN(Number(id))) {
        throw ApiError.badRequest('Invalid CV id');
    }

    const cv = await Cv.findByPk(id, {
        include: [
            {
                model: Position,
                include: [
                    {
                        model: Attribute,
                        as: 'attributes',
                    },
                ],
            },
            {
                model: User,
                attributes: [
                    'id',
                    'firstName',
                    'lastName',
                    'email',
                ],
            },
        ],
    });

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    if (req.user.role === 'RECRUITER' && cv.status !== 'published') {
        throw ApiError.forbidden('This CV is not published yet');
    }

    const candidateSkills = await CandidateSkills.findAll({
        where: {
            userId: cv.userId,
        },
    });

    const attributes = cv.position.attributes.map((attribute) => {
        const skill = candidateSkills.find(
            (item) => item.attributeId === attribute.id
        );

        return {
            id: attribute.id,
            name: attribute.name,
            description: attribute.description,
            type: attribute.type,
            options: attribute.options,
            value: skill ? skill.value : null,
        };
    });

    const projects = await Project.findAll({
        where: {
            userId: cv.userId,
        },
    });

    return res.json({
        cv,
        attributes,
        projects,
    });
};

const getCvsByPosition = async (req, res) => {
    const { positionId } = req.params;

    const cvs = await Cv.findAll({
        where: { positionId, status: 'published' },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName'],
            },
        ],
    });

    return res.json({
        cvsByPosition: cvs,
    });
};

const getAllCv = async (req, res) => {
    const { tag } = req.query;

    const cvs = await Cv.findAll({
        include: [
            {
                model: Position,
                attributes: ['id', 'title'],
            },
            {
                model: User,
                attributes: [
                    'id',
                    'firstName',
                    'lastName',
                ],
            },
        ],
    });

    let filteredCvs = cvs;

    if (req.user.role === 'RECRUITER') {
        filteredCvs = filteredCvs.filter((el) => el.status === 'published');
    }

    if (tag) {
        const skills = await CandidateSkills.findAll({
            include: [{ model: Attribute, as: 'attribute', attributes: ['name'] }],
        });

        const userIdsWithTag = [];
        for (const skill of skills) {
            if (skill.attribute && skill.attribute.name === tag) {
                userIdsWithTag.push(skill.userId);
            }
        }

        filteredCvs = filteredCvs.filter((el) => userIdsWithTag.includes(el.userId));
    }

    return res.json({
        allCv: filteredCvs,
    });
};

const publishCv = async (req, res) => {
    const { id } = req.params;

    const cv = await Cv.findByPk(id, {
        include: [
            {
                model: Position,
                include: [
                    {
                        model: Attribute,
                        as: 'attributes',
                    },
                ],
            },
        ],
    });

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    const isOwner = cv.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
        throw ApiError.forbidden('You can publish only your own CV');
    }

    const candidateSkills = await CandidateSkills.findAll({
        where: {
            userId: cv.userId,
        },
    });

    for (const attribute of cv.position.attributes) {
        const skill = candidateSkills.find(
            (item) => item.attributeId === attribute.id
        );

        if (!skill || !skill.value) {
            throw ApiError.badRequest('Fill in all attributes before publishing');
        }
    }

    await cv.update({ status: 'published' });

    return res.json({
        message: 'CV published',
    });
};

const deleteCv = async (req, res) => {
    const { id } = req.params;

    const cv = await Cv.findByPk(id);

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    const isOwner = cv.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
        throw ApiError.forbidden(
            'You can delete only your own CV'
        );
    }

    await cv.destroy();

    return res.json({
        message: 'CV deleted',
    });
};

export default {
    createCv,
    getCv,
    getCvsByPosition,
    getAllCv,
    publishCv,
    deleteCv,
};
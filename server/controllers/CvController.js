import { ZodError } from 'zod';
import { Op } from 'sequelize';
import { ApiError } from '../errors/ApiError.js';
import { Cv, Position, User } from '../models/models.js';
import { validateCvContent, validateCvUpdate } from '../schemas/cvContentSchema.js';
import {
    buildSnapshotFromProfile,
    isSnapshotComplete,
    mergeSnapshotSections,
} from '../service/cv-snapshot-service.js';

const ALLOWED_REFRESH_SECTIONS = new Set(['contact', 'skills', 'education', 'projects']);

const canReadCv = (cv, user) =>
    user.role === 'ADMIN' ||
    cv.userId === user.id ||
    (user.role === 'RECRUITER' && cv.status === 'published');

const parseOrBadRequest = (validate, body) => {
    try {
        return validate(body);
    } catch (err) {
        if (err instanceof ZodError) {
            throw ApiError.badRequest(err.issues[0]?.message ?? 'Invalid request');
        }
        throw err;
    }
};

const assertCanMutateCv = (cv, user, message = 'You can modify only your own CV') => {
    const isOwner = cv.userId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw ApiError.forbidden(message);
    }
};

const loadPositionForCreate = async (positionId) => {
    const position = await Position.findByPk(positionId, {
        include: [
            {
                model: User,
                as: 'allowedCandidates',
                attributes: ['id'],
            },
        ],
    });

    if (!position) {
        throw ApiError.notFound('Position not found');
    }

    return position;
};

const assertCandidatePositionAccess = (position, user) => {
    if (user.role !== 'CANDIDATE') return;

    const allowed = position.allowedCandidates ?? [];
    if (allowed.length === 0) return;

    const hasAccess = allowed.some((candidate) => candidate.id === user.id);
    if (!hasAccess) {
        throw ApiError.forbidden('You do not have access to this position');
    }
};

const createCv = async (req, res) => {
    const { positionId } = req.body;

    if (!positionId) {
        throw ApiError.badRequest('positionId is required');
    }

    const position = await loadPositionForCreate(positionId);
    assertCandidatePositionAccess(position, req.user);

    const content = parseOrBadRequest(
        validateCvContent,
        await buildSnapshotFromProfile(req.user.id),
    );
    const lastSyncedFromProfileAt = new Date();

    const cv = await Cv.create({
        positionId,
        userId: req.user.id,
        templateKey: 'editorial-sidebar',
        content,
        lastSyncedFromProfileAt,
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
                attributes: ['id', 'title'],
            },
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName'],
            },
        ],
    });

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    if (!canReadCv(cv, req.user)) {
        throw ApiError.forbidden('Access denied');
    }

    return res.json({ cv });
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
    const where = {};

    if (req.user.role === 'CANDIDATE') {
        where.userId = req.user.id;
    }
    if (req.user.role === 'RECRUITER') {
        where.status = 'published';
    }

    if (tag) {
        where.content = {
            [Op.contains]: { skills: [{ label: tag }] },
        };
    }

    const cvs = await Cv.findAll({
        where,
        include: [
            {
                model: Position,
                attributes: ['id', 'title'],
            },
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName'],
            },
        ],
    });

    return res.json({
        allCv: cvs,
    });
};

const updateCv = async (req, res) => {
    const { id } = req.params;
    const data = parseOrBadRequest(validateCvUpdate, req.body);

    const cv = await Cv.findByPk(id);

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    assertCanMutateCv(cv, req.user);

    const patch = {};
    if (data.content !== undefined) patch.content = data.content;
    if (data.templateKey !== undefined) patch.templateKey = data.templateKey;

    await cv.update(patch);

    return res.json({ cv });
};

const refreshCvFromProfile = async (req, res) => {
    const { id } = req.params;
    const sections = req.body?.sections;

    if (!Array.isArray(sections) || sections.length === 0) {
        throw ApiError.badRequest('sections must be a non-empty array');
    }

    for (const section of sections) {
        if (!ALLOWED_REFRESH_SECTIONS.has(section)) {
            throw ApiError.badRequest('Unknown refresh section');
        }
    }

    const cv = await Cv.findByPk(id);

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    assertCanMutateCv(cv, req.user);

    const defaults = await buildSnapshotFromProfile(cv.userId);
    const existing = cv.content ?? {
        contact: { name: '', links: [] },
        skills: [],
        education: [],
        projects: [],
    };
    const content = parseOrBadRequest(
        validateCvContent,
        mergeSnapshotSections(existing, defaults, sections),
    );
    const lastSyncedFromProfileAt = new Date();

    await cv.update({ content, lastSyncedFromProfileAt });

    return res.json({
        cv,
        refreshedAt: lastSyncedFromProfileAt.toISOString(),
    });
};

const publishCv = async (req, res) => {
    const { id } = req.params;

    const cv = await Cv.findByPk(id);

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    assertCanMutateCv(cv, req.user, 'You can publish only your own CV');

    if (!cv.content || !isSnapshotComplete(cv.content)) {
        throw ApiError.badRequest('Complete required CV fields before publishing');
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

    assertCanMutateCv(cv, req.user, 'You can delete only your own CV');

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
    updateCv,
    refreshCvFromProfile,
    publishCv,
    deleteCv,
};

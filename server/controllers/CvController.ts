import { createCvBody, routeId, skillTagQuery } from '../schemas/requestSchemas.js';
import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import { Op, type InferAttributes, type WhereOptions } from 'sequelize';
import { ApiError } from '../errors/ApiError.js';
import { Cv, Position, User } from '../models/models.js';
import { validateCvContent, validateCvUpdate, type CvContent } from '../schemas/cvContentSchema.js';
import type { AuthUser } from '../types/auth.js';
import { getAuthUser, parseOrBadRequest } from '../utils/validation.js';
import {
    buildSnapshotFromProfile,
    isSnapshotComplete,
    mergeSnapshotSections,
    type CvSection,
} from './cvSnapshot.js';

const ALLOWED_REFRESH_SECTIONS = new Set<unknown>(['contact', 'skills', 'education', 'projects']);

const isCvSection = (section: unknown): section is CvSection => ALLOWED_REFRESH_SECTIONS.has(section);

const assertCanMutateCv = (cv: Cv, user: AuthUser, message = 'You can modify only your own CV') => {
    const isOwner = cv.userId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw ApiError.forbidden(message);
    }
};

const createCv = async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { positionId } = parseOrBadRequest(createCvBody.parse, req.body);

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

    if (user.role === 'CANDIDATE') {
        const allowed = position.allowedCandidates || [];
        const hasAccess = allowed.length === 0 || allowed.some((candidate) => candidate.id === user.id);
        if (!hasAccess) {
            throw ApiError.forbidden('You do not have access to this position');
        }
    }

    const content = parseOrBadRequest(
        validateCvContent,
        await buildSnapshotFromProfile(user.id),
    );
    const lastSyncedFromProfileAt = new Date();

    const cv = await Cv.create({
        positionId,
        userId: user.id,
        templateKey: 'editorial-sidebar',
        content,
        lastSyncedFromProfileAt,
    });

    return res.json({ cv });
};

const getCv = async (req: Request<IdParams>, res: Response) => {
    const user = getAuthUser(req);
    const id = parseOrBadRequest(routeId.parse, req.params.id);

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

    const canRead =
        user.role === 'ADMIN' ||
        cv.userId === user.id ||
        (user.role === 'RECRUITER' && cv.status === 'published');

    if (!canRead) {
        throw ApiError.forbidden('Access denied');
    }

    return res.json({ cv });
};

const getCvsByPosition = async (req: Request<{ positionId: string }>, res: Response) => {
    const positionId = parseOrBadRequest(routeId.parse, req.params.positionId);

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

const getAllCv = async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const tag = parseOrBadRequest(skillTagQuery.parse, req.query.tag);
    const where: Record<string, unknown> = {};

    if (user.role === 'CANDIDATE') {
        where.userId = user.id;
    }
    if (user.role === 'RECRUITER') {
        where.status = 'published';
    }

    if (tag) {
        where.content = {
            [Op.contains]: { skills: [{ label: tag }] },
        };
    }

    const cvs = await Cv.findAll({
        where: where as WhereOptions<InferAttributes<Cv>>,
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

const updateCv = async (req: Request<IdParams>, res: Response) => {
    const user = getAuthUser(req);
    const id = parseOrBadRequest(routeId.parse, req.params.id);
    const data = parseOrBadRequest(validateCvUpdate, req.body);

    const cv = await Cv.findByPk(id);

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    assertCanMutateCv(cv, user);

    const patch: Partial<InferAttributes<Cv>> = {};
    if (data.content !== undefined) patch.content = data.content;
    if (data.templateKey !== undefined) patch.templateKey = data.templateKey;

    await cv.update(patch);

    return res.json({ cv });
};

const refreshCvFromProfile = async (req: Request<IdParams>, res: Response) => {
    const user = getAuthUser(req);
    const id = parseOrBadRequest(routeId.parse, req.params.id);
    const sections: unknown = req.body?.sections;

    if (!Array.isArray(sections) || sections.length === 0 || sections.length > ALLOWED_REFRESH_SECTIONS.size) {
        throw ApiError.badRequest('sections must be a non-empty array');
    }

    if (!sections.every(isCvSection)) {
        throw ApiError.badRequest('Unknown refresh section');
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

    assertCanMutateCv(cv, user);

    const defaults = await buildSnapshotFromProfile(cv.userId);
    const existing: CvContent = cv.content || {
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

const publishCv = async (req: Request<IdParams>, res: Response) => {
    const user = getAuthUser(req);
    const id = parseOrBadRequest(routeId.parse, req.params.id);

    const cv = await Cv.findByPk(id);

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    assertCanMutateCv(cv, user, 'You can publish only your own CV');

    if (!cv.content || !isSnapshotComplete(cv.content)) {
        throw ApiError.badRequest('Complete required CV fields before publishing');
    }

    await cv.update({ status: 'published' });

    return res.json({
        message: 'CV published',
    });
};

const deleteCv = async (req: Request<IdParams>, res: Response) => {
    const user = getAuthUser(req);
    const id = parseOrBadRequest(routeId.parse, req.params.id);

    const cv = await Cv.findByPk(id);

    if (!cv) {
        throw ApiError.notFound('CV not found');
    }

    assertCanMutateCv(cv, user, 'You can delete only your own CV');

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

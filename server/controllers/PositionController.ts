import sequelize from '../dB.js';
import { createPositionBody, routeId, updatePositionBody } from '../schemas/requestSchemas.js';
import type { AuthUser } from '../types/auth.js';
import { getAuthUser, parseOrBadRequest } from '../utils/validation.js';
import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import { ApiError } from '../errors/ApiError.js';
import { Position, Attribute, Cv, User, CandidateSkills, setPositionAttributes } from '../models/models.js';

interface DashboardTag {
  id: number;
  name: string;
  count: number;
}

const canReadPosition = (position: Position, user: AuthUser | undefined) => {
  const allowed = position.allowedCandidates ?? [];
  return allowed.length === 0 || user?.role === 'ADMIN' || user?.role === 'RECRUITER' ||
    allowed.some((candidate) => candidate.id === user?.id);
};

const toVisiblePosition = (position: Position, user: AuthUser | undefined) => ({
  ...position.toJSON(),
  allowedCandidates: user?.role === 'ADMIN' || user?.role === 'RECRUITER'
    ? position.allowedCandidates
    : undefined,
});

const assertCanManagePosition = (position: Position, user: AuthUser) => {
  if (user.role !== 'ADMIN' && (position.userId ?? position.userIdCreator) !== user.id) {
    throw ApiError.forbidden('Only the position owner can manage this position');
  }
};

const createPosition = async (req: Request, res: Response) => {
  const { id: userId } = getAuthUser(req);
  const { title, description, attributeIds, allowedCandidateIds } =
    parseOrBadRequest(createPositionBody.parse, req.body);

  const position = await sequelize.transaction(async (transaction) => {
    const created = await Position.create({
      title, description: description ?? null, userId, userIdCreator: userId,
    }, { transaction });

    if (attributeIds?.length) await setPositionAttributes(created, attributeIds, transaction);
    if (allowedCandidateIds?.length) await created.setAllowedCandidates(allowedCandidateIds, { transaction });
    return created;
  });

  return res.json({ position });
};

const getPosition = async (req: Request<IdParams>, res: Response) => {
  const id = parseOrBadRequest(routeId.parse, req.params.id);

  const position = await Position.findByPk(id, {
    include: [
      {
        model: Attribute,
        as: 'attributes',
      },
      {
        model: User,
        as: 'allowedCandidates',
        attributes: ['id'],
      },
    ],
  });

  if (!position || !canReadPosition(position, req.user)) {
    throw ApiError.notFound('Position not found');
  }

  return res.json({ position: toVisiblePosition(position, req.user) });
};

const updatePosition = async (req: Request<IdParams>, res: Response) => {
  const id = parseOrBadRequest(routeId.parse, req.params.id);
  const user = getAuthUser(req);
  const { title, description, attributeIds, allowedCandidateIds } =
    parseOrBadRequest(updatePositionBody.parse, req.body);

  await sequelize.transaction(async (transaction) => {
    const position = await Position.findByPk(id, { transaction, lock: true });
    if (!position) throw ApiError.notFound('Position not found');
    assertCanManagePosition(position, user);

    await position.update({ title, description }, { transaction });
    if (attributeIds) await setPositionAttributes(position, attributeIds, transaction);
    if (allowedCandidateIds) await position.setAllowedCandidates(allowedCandidateIds, { transaction });
  });

  return res.json({ message: 'Position updated' });
};

const deletePosition = async (req: Request<IdParams>, res: Response) => {
  const id = parseOrBadRequest(routeId.parse, req.params.id);
  const user = getAuthUser(req);
  await sequelize.transaction(async (transaction) => {
    const position = await Position.findByPk(id, { transaction, lock: true });
    if (!position) throw ApiError.notFound('Position not found');
    assertCanManagePosition(position, user);
    await position.destroy({ transaction });
  });

  return res.json({ message: 'Position deleted' });
};

const getAllPositions = async (req: Request, res: Response) => {
  const positions = await Position.findAll({
    include: [
      {
        model: Attribute,
        as: 'attributes',
      },
      {
        model: User,
        as: 'allowedCandidates',
        attributes: ['id'],
      },
    ],
  });

  const visible = positions.filter((position) => canReadPosition(position, req.user));
  return res.json({ allPositions: visible.map((position) => toVisiblePosition(position, req.user)) });
};

const getDashboardStats = async (req: Request, res: Response) => {
  const candidatesCount = await User.count({ where: { role: 'CANDIDATE' } });
  const recruitersCount = await User.count({ where: { role: 'RECRUITER' } });

  const positions = (await Position.findAll({
    attributes: ['id', 'title', 'updatedAt'],
    include: [{ model: User, as: 'allowedCandidates', attributes: ['id'] }],
  })).filter((position) => canReadPosition(position, req.user));
  const positionsCount = positions.length;

  const allCvs = await Cv.findAll({
    attributes: ['positionId'],
    where: { positionId: positions.map((position) => position.id), status: 'published' },
  });
  const cvsCount = allCvs.length;

  const countByPositionId: Record<number, number> = {};
  for (const cv of allCvs) {
    if (countByPositionId[cv.positionId]) {
      countByPositionId[cv.positionId]++;
    } else {
      countByPositionId[cv.positionId] = 1;
    }
  }

  const positionsWithCounts = positions.map((position) => ({
    id: position.id,
    title: position.title,
    updatedAt: position.updatedAt,
    cvCount: countByPositionId[position.id] || 0,
  }));

  const latestPositions = positionsWithCounts
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const popularPositions = positionsWithCounts
    .slice()
    .sort((a, b) => b.cvCount - a.cvCount)
    .slice(0, 5);

  const skills = await CandidateSkills.findAll({
    include: [
      {
        model: Attribute,
        as: 'attribute',
        attributes: ['name'],
      },
    ],
  });

  const tags: DashboardTag[] = [];
  for (const skill of skills) {
    if (!skill.attribute) continue;

    const existingTag = tags.find((el) => el.id === skill.attributeId);

    if (existingTag) {
      existingTag.count++;
    } else {
      tags.push({ id: skill.attributeId, name: skill.attribute.name, count: 1 });
    }
  }

  return res.json({
    stats: {
      positionsCount,
      cvsCount,
      candidatesCount,
      recruitersCount,
    },
    latestPositions,
    popularPositions,
    tags,
  });
};

export default {
  createPosition,
  getPosition,
  updatePosition,
  deletePosition,
  getAllPositions,
  getDashboardStats,
};

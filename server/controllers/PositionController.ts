import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import { ApiError } from '../errors/ApiError.js';
import { Position, Attribute, Cv, User, CandidateSkills, setPositionAttributes } from '../models/models.js';

interface PositionBody {
  title?: string;
  description?: string | null;
  userIdCreator?: number | null;
  attributeIds?: number[];
  allowedCandidateIds?: number[];
}

interface DashboardTag {
  id: number;
  name: string;
  count: number;
}

const createPosition = async (req: Request, res: Response) => {
  const {
    title,
    description,
    userIdCreator,
    attributeIds,
    allowedCandidateIds,
  }: PositionBody = req.body;

  const position = await Position.create({
    title: title as string,
    description: description ?? null,
    userIdCreator: userIdCreator ?? null,
  });

  if (attributeIds && attributeIds.length) {
    await setPositionAttributes(position, attributeIds);
  }

  if (allowedCandidateIds && allowedCandidateIds.length) {
    await position.setAllowedCandidates(allowedCandidateIds);
  }

  return res.json({ position });
};

const getPosition = async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;

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

  if (!position) {
    throw ApiError.notFound('Position not found');
  }

  return res.json({ position });
};

const updatePosition = async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;
  const {
    title,
    description,
    attributeIds,
    allowedCandidateIds,
  }: PositionBody = req.body;

  const position = await Position.findByPk(id);

  if (!position) {
    throw ApiError.notFound('Position not found');
  }

  await position.update({
    title,
    description,
  });

  if (attributeIds && attributeIds.length) {
    await setPositionAttributes(position, attributeIds);
  }

  if (allowedCandidateIds) {
    await position.setAllowedCandidates(allowedCandidateIds);
  }

  return res.json({
    message: 'Position updated',
  });
};

const deletePosition = async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;

  const deletedRows = await Position.destroy({
    where: { id: Number(id) },
  });

  if (!deletedRows) {
    throw ApiError.notFound('Position not found');
  }

  return res.json({
    message: 'Position deleted',
  });
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

  if (!req.user || req.user.role !== 'CANDIDATE') {
    return res.json({ allPositions: positions });
  }

  const visiblePositions: Position[] = [];

  for (const position of positions) {
    const allowedCandidates = position.allowedCandidates ?? [];
    const isRestricted = allowedCandidates.length > 0;

    let hasAccess = false;
    for (const candidate of allowedCandidates) {
      if (candidate.id === req.user.id) {
        hasAccess = true;
      }
    }

    if (!isRestricted || hasAccess) {
      visiblePositions.push(position);
    }
  }

  return res.json({
    allPositions: visiblePositions,
  });
};

const getDashboardStats = async (_req: Request, res: Response) => {
  const positionsCount = await Position.count();
  const cvsCount = await Cv.count();
  const candidatesCount = await User.count({ where: { role: 'CANDIDATE' } });
  const recruitersCount = await User.count({ where: { role: 'RECRUITER' } });

  const positions = await Position.findAll({
    attributes: ['id', 'title', 'updatedAt'],
  });

  const allCvs = await Cv.findAll({
    attributes: ['positionId'],
  });

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

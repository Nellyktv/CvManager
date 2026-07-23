import { ApiError } from '../errors/ApiError.js';
import { Position, Attribute, Cv, User, CandidateSkills } from '../models/models.js';

const createPosition = async (req, res) => {
  const {
    title,
    description,
    visibility,
    userIdCreator,
    attributeIds,
    allowedCandidateIds,
  } = req.body;

  const position = await Position.create({
    title,
    description,
    visibility,
    userIdCreator,
  });

  if (attributeIds && attributeIds.length) {
    await position.setAttributes(attributeIds);
  }

  if (allowedCandidateIds && allowedCandidateIds.length) {
    await position.setAllowedCandidates(allowedCandidateIds);
  }

  return res.json({ position });
};

const getPosition = async (req, res) => {
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

const updatePosition = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    visibility,
    attributeIds,
    allowedCandidateIds,
  } = req.body;

  const position = await Position.findByPk(id);

  if (!position) {
    throw ApiError.notFound('Position not found');
  }

  await position.update({
    title,
    description,
    visibility,
  });

  if (attributeIds && attributeIds.length) {
    await position.setAttributes(attributeIds);
  }

  if (allowedCandidateIds) {
    await position.setAllowedCandidates(allowedCandidateIds);
  }

  return res.json({
    message: 'Position updated',
  });
};

const deletePosition = async (req, res) => {
  const { id } = req.params;

  const deletedRows = await Position.destroy({
    where: { id },
  });

  if (!deletedRows) {
    throw ApiError.notFound('Position not found');
  }

  return res.json({
    message: 'Position deleted',
  });
};

const getAllPositions = async (req, res) => {
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

  const visiblePositions = [];

  for (const position of positions) {
    const isRestricted = position.allowedCandidates.length > 0;

    let hasAccess = false;
    for (const candidate of position.allowedCandidates) {
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

const getDashboardStats = async (req, res) => {
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

  const countByPositionId = {};
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
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
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

  const tags = [];
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

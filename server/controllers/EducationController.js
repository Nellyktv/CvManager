import { ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';
import { Education } from '../models/models.js';
import {
  isValidDateRange,
  validateEducationCreate,
  validateEducationUpdate,
} from '../schemas/cvContentSchema.js';

const parseOrBadRequest = (validate, body) => {
  try {
    return validate(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw ApiError.badRequest(err.issues[0]?.message || 'Invalid request');
    }
    throw err;
  }
};

const assertMergedDateRange = (existing, data) => {
  const range = {
    startDate: data.startDate !== undefined ? data.startDate : existing.startDate,
    endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
  };
  if (!isValidDateRange(range)) {
    throw ApiError.badRequest('Invalid date range');
  }
};

const getEducations = async (req, res) => {
  const educations = await Education.findAll({
    where: { userId: req.user.id },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return res.json({ educations });
};

const createEducation = async (req, res) => {
  const data = parseOrBadRequest(validateEducationCreate, req.body);

  const education = await Education.create({
    ...data,
    userId: req.user.id,
  });

  return res.json({ education });
};

const updateEducation = async (req, res) => {
  const data = parseOrBadRequest(validateEducationUpdate, req.body);
  const education = await Education.findByPk(req.params.id);

  if (!education) {
    throw ApiError.notFound('Education not found');
  }

  if (education.userId !== req.user.id) {
    throw ApiError.forbidden('You can edit only your own education');
  }

  assertMergedDateRange(education, data);

  await education.update(data);

  return res.json({ education });
};

const deleteEducation = async (req, res) => {
  const education = await Education.findByPk(req.params.id);

  if (!education) {
    throw ApiError.notFound('Education not found');
  }

  if (education.userId !== req.user.id) {
    throw ApiError.forbidden('You can delete only your own education');
  }

  await education.destroy();

  return res.json({ message: 'Education deleted' });
};

export default {
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
};

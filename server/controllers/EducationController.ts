import { routeId } from '../schemas/requestSchemas.js';
import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import { ApiError } from '../errors/ApiError.js';
import { Education } from '../models/models.js';
import {
  validateEducationCreate,
  validateEducationUpdate,
} from '../schemas/cvContentSchema.js';
import { assertMergedDateRange, getAuthUser, parseOrBadRequest } from '../utils/validation.js';

const getEducations = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const educations = await Education.findAll({
    where: { userId: user.id },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return res.json({ educations });
};

const createEducation = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const data = parseOrBadRequest(validateEducationCreate, req.body);

  const education = await Education.create({
    ...data,
    userId: user.id,
  });

  return res.json({ education });
};

const updateEducation = async (req: Request<IdParams>, res: Response) => {
  const user = getAuthUser(req);
  const data = parseOrBadRequest(validateEducationUpdate, req.body);
  const education = await Education.findByPk(parseOrBadRequest(routeId.parse, req.params.id));

  if (!education) {
    throw ApiError.notFound('Education not found');
  }

  if (education.userId !== user.id) {
    throw ApiError.forbidden('You can edit only your own education');
  }

  assertMergedDateRange(education, data);

  await education.update(data);

  return res.json({ education });
};

const deleteEducation = async (req: Request<IdParams>, res: Response) => {
  const user = getAuthUser(req);
  const education = await Education.findByPk(parseOrBadRequest(routeId.parse, req.params.id));

  if (!education) {
    throw ApiError.notFound('Education not found');
  }

  if (education.userId !== user.id) {
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

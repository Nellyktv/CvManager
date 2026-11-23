import { routeId } from '../schemas/requestSchemas.js';
import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import type { InferAttributes } from 'sequelize';
import { ApiError } from '../errors/ApiError.js';
import { Project } from '../models/models.js';
import {
  validateProjectCreate,
  validateProjectUpdate,
} from '../schemas/cvContentSchema.js';
import { assertMergedDateRange, getAuthUser, parseOrBadRequest } from '../utils/validation.js';

const getMyProjects = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const projects = await Project.findAll({
    where: { userId: user.id },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return res.json({ projects });
};

const createProject = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const data = parseOrBadRequest(validateProjectCreate, req.body);

  const project = await Project.create({
    title: data.title,
    role: data.role ?? null,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    links: data.links ?? null,
    displayOrder: data.displayOrder ?? null,
    descriptionMarkdown: data.descriptionMarkdown ?? null,
    userId: user.id,
  });

  return res.json({ project });
};

const updateProject = async (req: Request<IdParams>, res: Response) => {
  const user = getAuthUser(req);
  const id = parseOrBadRequest(routeId.parse, req.params.id);
  const data = parseOrBadRequest(validateProjectUpdate, req.body);

  const project = await Project.findByPk(id);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.userId !== user.id) {
    throw ApiError.forbidden('You can edit only your own projects');
  }

  assertMergedDateRange(project, data);

  const updates: Partial<InferAttributes<Project>> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.role !== undefined) updates.role = data.role;
  if (data.startDate !== undefined) updates.startDate = data.startDate;
  if (data.endDate !== undefined) updates.endDate = data.endDate;
  if (data.links !== undefined) updates.links = data.links;
  if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;
  if (data.descriptionMarkdown !== undefined) updates.descriptionMarkdown = data.descriptionMarkdown;

  await project.update(updates);

  return res.json({
    project,
  });
};

const deleteProject = async (req: Request<IdParams>, res: Response) => {
  const user = getAuthUser(req);
  const id = parseOrBadRequest(routeId.parse, req.params.id);

  const project = await Project.findByPk(id);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.userId !== user.id) {
    throw ApiError.forbidden('You can delete only your own projects');
  }

  await project.destroy();

  return res.json({
    message: 'Project deleted',
  });
};

export default {
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
};

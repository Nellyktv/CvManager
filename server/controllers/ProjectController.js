import { ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';
import { Project } from '../models/models.js';
import {
  isValidDateRange,
  validateProjectCreate,
  validateProjectUpdate,
} from '../schemas/cvContentSchema.js';

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

const resolveDescriptionMarkdown = (data) => {
  if (data.descriptionMarkdown !== undefined) return data.descriptionMarkdown;
  if (data.description !== undefined) return data.description;
  return undefined;
};

const presentProject = (project) => {
  const data = typeof project.toJSON === 'function' ? project.toJSON() : { ...project };
  const markdown =
    data.descriptionMarkdown != null && data.descriptionMarkdown !== ''
      ? data.descriptionMarkdown
      : data.description;
  return {
    ...data,
    descriptionMarkdown: markdown ?? data.descriptionMarkdown,
  };
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

const getMyProjects = async (req, res) => {
  const projects = await Project.findAll({
    where: { userId: req.user.id },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return res.json({ projects: projects.map(presentProject) });
};

const createProject = async (req, res) => {
  const data = parseOrBadRequest(validateProjectCreate, req.body);
  const descriptionMarkdown = resolveDescriptionMarkdown(data);

  const project = await Project.create({
    title: data.title,
    role: data.role,
    startDate: data.startDate,
    endDate: data.endDate,
    links: data.links,
    displayOrder: data.displayOrder,
    descriptionMarkdown,
    userId: req.user.id,
  });

  return res.json({ project: presentProject(project) });
};

const updateProject = async (req, res) => {
  const { id } = req.params;
  const data = parseOrBadRequest(validateProjectUpdate, req.body);

  const project = await Project.findByPk(id);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.userId !== req.user.id) {
    throw ApiError.forbidden('You can edit only your own projects');
  }

  assertMergedDateRange(project, data);

  const updates = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.role !== undefined) updates.role = data.role;
  if (data.startDate !== undefined) updates.startDate = data.startDate;
  if (data.endDate !== undefined) updates.endDate = data.endDate;
  if (data.links !== undefined) updates.links = data.links;
  if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;

  const descriptionMarkdown = resolveDescriptionMarkdown(data);
  if (descriptionMarkdown !== undefined) {
    updates.descriptionMarkdown = descriptionMarkdown;
  }

  await project.update(updates);

  return res.json({
    project: presentProject(project),
  });
};

const deleteProject = async (req, res) => {
  const { id } = req.params;

  const project = await Project.findByPk(id);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.userId !== req.user.id) {
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

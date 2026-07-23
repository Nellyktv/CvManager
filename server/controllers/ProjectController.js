import { ApiError } from '../errors/ApiError.js';
import { Project } from '../models/models.js';

const getMyProjects = async (req, res) => {
    const projects = await Project.findAll({
        where: { userId: req.user.id },
    });

    return res.json({ projects });
};

const createProject = async (req, res) => {
    const { title, description } = req.body;

    const project = await Project.create({
        title,
        description,
        userId: req.user.id,
    });

    return res.json({ project });
};

const updateProject = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
        throw ApiError.notFound('Project not found');
    }

    if (project.userId !== req.user.id) {
        throw ApiError.forbidden('You can edit only your own projects');
    }

    await project.update({ title, description });

    return res.json({
        message: 'Project updated',
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

import type { Request, Response } from 'express';
import { ApiError } from '../errors/ApiError.js';
import { CandidateSkills, Attribute } from '../models/models.js';
import { getAuthUser } from '../utils/validation.js';

const getMySkills = async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const skills = await CandidateSkills.findAll({
        where: {
            userId: user.id,
        },
        include: [{ model: Attribute, as: 'attribute' }],
    });

    return res.json({ skills });
};

const saveSkill = async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { attributeId, value }: { attributeId?: number; value?: string | null } = req.body;

    if (!attributeId) {
        throw ApiError.badRequest('attributeId is required');
    }

    const candidateSkill = await CandidateSkills.findOne({
        where: {
            userId: user.id,
            attributeId,
        },
    });

    if (candidateSkill) {
        await candidateSkill.update({
            value,
        });

        return res.json({
            skill: candidateSkill,
        });
    }

    const newSkill = await CandidateSkills.create({
        userId: user.id,
        attributeId,
        value: value ?? null,
    });

    return res.json({
        skill: newSkill,
    });
};

const deleteSkill = async (req: Request<{ attributeId: string }>, res: Response) => {
    const user = getAuthUser(req);
    const { attributeId } = req.params;

    await CandidateSkills.destroy({
        where: {
            userId: user.id,
            attributeId: Number(attributeId),
        },
    });

    return res.json({
        message: 'Skill removed',
    });
};

export default {
    getMySkills,
    saveSkill,
    deleteSkill,
};

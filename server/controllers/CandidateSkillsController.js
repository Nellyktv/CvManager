import { ApiError } from '../errors/ApiError.js';
import { CandidateSkills, Attribute } from '../models/models.js';

const getMySkills = async (req, res) => {
    const skills = await CandidateSkills.findAll({
        where: {
            userId: req.user.id,
        },
        include: [{ model: Attribute, as: 'attribute' }],
    });

    return res.json({ skills });
};

const saveSkill = async (req, res) => {
    const { attributeId, value } = req.body;

    if (!attributeId) {
        throw ApiError.badRequest('attributeId is required');
    }

    const candidateSkill = await CandidateSkills.findOne({
        where: {
            userId: req.user.id,
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
        userId: req.user.id,
        attributeId,
        value,
    });

    return res.json({
        skill: newSkill,
    });
};

const deleteSkill = async (req, res) => {
    const { attributeId } = req.params;

    await CandidateSkills.destroy({
        where: {
            userId: req.user.id,
            attributeId,
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
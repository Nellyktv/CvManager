import { ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';
import { CandidateProfile } from '../models/models.js';
import { validateProfileUpdate } from '../schemas/cvContentSchema.js';

const PROFILE_FIELDS = [
  'headline',
  'publicEmail',
  'phone',
  'location',
  'linkedinUrl',
  'githubUrl',
  'portfolioUrl',
];

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

const pickProfileUpdates = (data) => {
  const updates = {};
  for (const key of PROFILE_FIELDS) {
    if (data[key] !== undefined) {
      updates[key] = data[key] === '' ? null : data[key];
    }
  }
  return updates;
};

const getProfile = async (req, res) => {
  let profile = await CandidateProfile.findOne({
    where: { userId: req.user.id },
  });

  if (!profile) {
    profile = await CandidateProfile.create({ userId: req.user.id });
  }

  return res.json({ profile });
};

const updateProfile = async (req, res) => {
  const data = parseOrBadRequest(validateProfileUpdate, req.body);
  const updates = pickProfileUpdates(data);

  let profile = await CandidateProfile.findOne({
    where: { userId: req.user.id },
  });

  if (!profile) {
    profile = await CandidateProfile.create({
      userId: req.user.id,
      ...updates,
    });
  } else {
    await profile.update(updates);
  }

  return res.json({ profile });
};

export default {
  getProfile,
  updateProfile,
};

import type { Request, Response } from 'express';
import { CandidateProfile } from '../models/models.js';
import { validateProfileUpdate } from '../schemas/cvContentSchema.js';
import { getAuthUser, parseOrBadRequest } from '../utils/validation.js';

const PROFILE_FIELDS = [
  'headline',
  'publicEmail',
  'phone',
  'location',
  'linkedinUrl',
  'githubUrl',
  'portfolioUrl',
] as const;

type ProfileUpdate = ReturnType<typeof validateProfileUpdate>;
type ProfileField = (typeof PROFILE_FIELDS)[number];

const pickProfileUpdates = (data: ProfileUpdate) => {
  const updates: Partial<Record<ProfileField, string | null>> = {};
  for (const key of PROFILE_FIELDS) {
    const value = data[key];
    if (value !== undefined) {
      updates[key] = value === '' ? null : value;
    }
  }
  return updates;
};

const getProfile = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  let profile = await CandidateProfile.findOne({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await CandidateProfile.create({ userId: user.id });
  }

  return res.json({ profile });
};

const updateProfile = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const data = parseOrBadRequest(validateProfileUpdate, req.body);
  const updates = pickProfileUpdates(data);

  let profile = await CandidateProfile.findOne({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await CandidateProfile.create({
      userId: user.id,
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

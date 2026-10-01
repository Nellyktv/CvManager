import 'dotenv/config';
import { fileURLToPath } from 'url';
import type { InferAttributes } from 'sequelize';
import sequelize from '../dB.js';
import { User, CandidateProfile, Cv } from '../models/models.js';
import { validateCvContent } from '../schemas/cvContentSchema.js';
import {
  buildSnapshotFromProfile,
  isSnapshotComplete,
} from '../controllers/cvSnapshot.js';

export async function backfillCvSnapshots() {
  const candidates = await User.findAll({ where: { role: 'CANDIDATE' } });
  const existingProfiles = await CandidateProfile.findAll();
  const profileUserIds = new Set(existingProfiles.map((p) => p.userId));

  let profilesCreated = 0;
  for (const candidate of candidates) {
    if (profileUserIds.has(candidate.id)) continue;
    await CandidateProfile.create({ userId: candidate.id });
    profileUserIds.add(candidate.id);
    profilesCreated += 1;
  }

  const cvs = await Cv.findAll({ where: { content: null } });
  let cvsBackfilled = 0;
  for (const cv of cvs) {
    const content = await buildSnapshotFromProfile(cv.userId);
    try {
      validateCvContent(content);
    } catch (err) {
      console.warn(
        `Skipping CV ${cv.id} (user ${cv.userId}): invalid profile-derived snapshot`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }
    const patch: Partial<InferAttributes<Cv>> = {
      content,
      templateKey: 'editorial-sidebar',
      lastSyncedFromProfileAt: new Date(),
    };
    if (cv.status === 'published' && !isSnapshotComplete(content)) {
      patch.status = 'draft';
    }
    await cv.update(patch);
    cvsBackfilled += 1;
  }

  return { profilesCreated, cvsBackfilled };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const counts = await backfillCvSnapshots();
    console.log(counts);
  } finally {
    await sequelize.close();
  }
}

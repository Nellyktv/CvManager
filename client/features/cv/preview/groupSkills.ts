import type { CvSkill } from '../../../shared/types/cv';

export type SkillGroupBucket = {
  group?: string;
  skills: CvSkill[];
};

/** Preserve first-seen group order; ungrouped skills follow as one bucket. */
export const groupSkills = (skills: CvSkill[]): SkillGroupBucket[] => {
  const order: string[] = [];
  const byGroup = new Map<string, CvSkill[]>();
  const ungrouped: CvSkill[] = [];

  for (const skill of skills) {
    const name = skill.group?.trim();
    if (!name) {
      ungrouped.push(skill);
      continue;
    }
    if (!byGroup.has(name)) {
      order.push(name);
      byGroup.set(name, []);
    }
    byGroup.get(name)!.push(skill);
  }

  const buckets: SkillGroupBucket[] = order.map((group) => ({
    group,
    skills: byGroup.get(group)!,
  }));

  if (ungrouped.length > 0) {
    buckets.push({ skills: ungrouped });
  }

  return buckets;
};

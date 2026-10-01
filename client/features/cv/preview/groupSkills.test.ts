import { describe, expect, it } from 'vitest';
import { groupSkills } from './groupSkills';

describe('groupSkills', () => {
  it('keeps groups in first-seen order and puts ungrouped skills last', () => {
    const result = groupSkills([
      { label: 'React', group: 'Frontend' },
      { label: 'English' },
      { label: 'Node.js', group: 'Backend' },
      { label: 'TypeScript', group: 'Frontend' },
    ]);

    expect(result).toEqual([
      { group: 'Frontend', skills: [{ label: 'React', group: 'Frontend' }, { label: 'TypeScript', group: 'Frontend' }] },
      { group: 'Backend', skills: [{ label: 'Node.js', group: 'Backend' }] },
      { skills: [{ label: 'English' }] },
    ]);
  });

  it('treats a blank group as ungrouped', () => {
    expect(groupSkills([{ label: 'Git', group: '  ' }])).toEqual([{ skills: [{ label: 'Git', group: '  ' }] }]);
  });

  it('returns an empty list for no skills', () => {
    expect(groupSkills([])).toEqual([]);
  });
});

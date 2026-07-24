import { describe, expect, it } from 'vitest';
import { isCvComplete } from './cvCompletion';
import type { CvContent } from '../types/cv';

const complete: CvContent = {
  contact: { name: 'Artem Ilyin', email: 'artem@example.com', links: [] },
  skills: [],
  education: [{ institution: 'BSUIR' }],
  projects: [],
};

describe('isCvComplete', () => {
  it('requires a name, email, and at least one education entry', () => {
    expect(isCvComplete(complete)).toBe(true);
    expect(isCvComplete({ ...complete, contact: { ...complete.contact, email: '' } })).toBe(false);
    expect(isCvComplete({ ...complete, education: [] })).toBe(false);
  });

  it('rejects whitespace-only name or email', () => {
    expect(isCvComplete({ ...complete, contact: { ...complete.contact, name: '   ' } })).toBe(false);
    expect(isCvComplete({ ...complete, contact: { ...complete.contact, email: '   ' } })).toBe(false);
  });

  it('requires at least one education entry with a nonblank institution', () => {
    expect(isCvComplete({ ...complete, education: [{ institution: '' }] })).toBe(false);
    expect(isCvComplete({ ...complete, education: [{ institution: '   ' }] })).toBe(false);
    expect(
      isCvComplete({
        ...complete,
        education: [{ institution: '   ' }, { institution: 'BSUIR' }],
      }),
    ).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CvContent } from '../schemas/cvContentSchema.js';

vi.mock('../models/models.js', () => ({
    User: { findByPk: vi.fn() },
    CandidateProfile: { findOne: vi.fn() },
    CandidateSkills: { findAll: vi.fn() },
    Education: { findAll: vi.fn() },
    Project: { findAll: vi.fn() },
    Attribute: {},
}));

const models = await import('../models/models.js');
const mocked = {
    findUser: vi.mocked(models.User.findByPk),
    findProfile: vi.mocked(models.CandidateProfile.findOne),
    findSkills: vi.mocked(models.CandidateSkills.findAll),
    findEducation: vi.mocked(models.Education.findAll),
    findProjects: vi.mocked(models.Project.findAll),
};
const { buildSnapshotFromProfile, isSnapshotComplete, mergeSnapshotSections } = await import(
    './cvSnapshot.js'
);

const snapshot = (overrides: Partial<CvContent> = {}): CvContent => ({
    contact: { name: 'Ivan Ivanov', email: 'ivan@demo.com', links: [] },
    skills: [],
    education: [{ institution: 'MSU' }],
    projects: [],
    ...overrides,
});

describe('isSnapshotComplete', () => {
    it('is true with a name, an email and an institution', () => {
        expect(isSnapshotComplete(snapshot())).toBe(true);
    });

    it('is false without an email', () => {
        expect(isSnapshotComplete(snapshot({ contact: { name: 'Ivan', email: '  ', links: [] } }))).toBe(false);
    });

    it('is false when all institutions are blank', () => {
        expect(isSnapshotComplete(snapshot({ education: [{ institution: ' ' }] }))).toBe(false);
    });
});

describe('mergeSnapshotSections', () => {
    it('replaces only the requested sections and keeps the rest', () => {
        const existing = snapshot({ skills: [{ label: 'Old' }] });
        const defaults = snapshot({
            contact: { name: 'New Name', email: 'new@demo.com', links: [] },
            skills: [{ label: 'New' }],
        });

        const merged = mergeSnapshotSections(existing, defaults, ['skills']);

        expect(merged.skills).toEqual([{ label: 'New' }]);
        expect(merged.contact.name).toBe('Ivan Ivanov');
    });

    it('does not mutate the existing snapshot', () => {
        const existing = snapshot();
        const defaults = snapshot({ education: [] });

        mergeSnapshotSections(existing, defaults, ['education']);

        expect(existing.education).toEqual([{ institution: 'MSU' }]);
    });
});

describe('buildSnapshotFromProfile', () => {
    beforeEach(() => {
        mocked.findUser.mockResolvedValue({ id: 1, firstName: ' Ivan ', lastName: 'Ivanov' } as never);
        mocked.findProfile.mockResolvedValue({
            headline: 'Frontend Developer',
            publicEmail: 'ivan@demo.com',
            githubUrl: 'https://github.com/ivan',
            linkedinUrl: '',
        } as never);
        mocked.findSkills.mockResolvedValue([{ value: 'Advanced', attribute: { name: 'React' } }] as never);
        mocked.findEducation.mockResolvedValue([{ institution: 'MSU', startDate: '2018-09-01' }] as never);
        mocked.findProjects.mockResolvedValue([
            { title: 'Store', links: [{ label: 'Repo', url: 'https://github.com/ivan/store', extra: 1 }] },
            { title: '   ' },
        ] as never);
    });

    it('builds CV content from the candidate profile', async () => {
        const content = await buildSnapshotFromProfile(1);

        expect(content.contact).toMatchObject({
            name: 'Ivan Ivanov',
            headline: 'Frontend Developer',
            email: 'ivan@demo.com',
            links: [{ label: 'GitHub', url: 'https://github.com/ivan' }],
        });
        expect(content.skills).toEqual([{ label: 'React', value: 'Advanced' }]);
        expect(content.education[0]).toMatchObject({ institution: 'MSU', startDate: '2018-09-01', endDate: '' });
    });

    it('skips projects without a title and keeps only label and url in links', async () => {
        const content = await buildSnapshotFromProfile(1);

        expect(content.projects).toHaveLength(1);
        expect(content.projects[0].links).toEqual([{ label: 'Repo', url: 'https://github.com/ivan/store' }]);
    });

    it('works for a user without a profile', async () => {
        mocked.findProfile.mockResolvedValue(null);

        const content = await buildSnapshotFromProfile(1);

        expect(content.contact.email).toBe('');
        expect(content.contact.links).toEqual([]);
    });
});

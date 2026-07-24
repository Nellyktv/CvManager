import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  User,
  CandidateProfile,
  Project,
  Cv,
  sequelize,
  buildSnapshotFromProfile,
  validateCvContent,
} = vi.hoisted(() => ({
  User: { findAll: vi.fn() },
  CandidateProfile: { findAll: vi.fn(), create: vi.fn() },
  Project: { findAll: vi.fn() },
  Cv: { findAll: vi.fn() },
  sequelize: { close: vi.fn(async () => {}) },
  buildSnapshotFromProfile: vi.fn(),
  validateCvContent: vi.fn((content) => content),
}));

vi.mock('../models/models.js', () => ({
  User,
  CandidateProfile,
  Project,
  Cv,
}));

vi.mock('../dB.js', () => ({
  default: sequelize,
}));

vi.mock('../service/cv-snapshot-service.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    buildSnapshotFromProfile,
  };
});

vi.mock('../schemas/cvContentSchema.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    validateCvContent,
  };
});

const { backfillCvSnapshots } = await import('./backfillCvSnapshots.js');

describe('backfillCvSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCvContent.mockImplementation((content) => content);
  });

  it('is idempotent and does not overwrite non-null cv.content', async () => {
    const candidates = [
      { id: 1, role: 'CANDIDATE' },
      { id: 2, role: 'CANDIDATE' },
    ];
    const profiles = [{ id: 10, userId: 1 }];
    const projects = [
      {
        id: 100,
        userId: 1,
        description: 'Built <strong>fast</strong>',
        descriptionMarkdown: null,
      },
      {
        id: 101,
        userId: 2,
        description: 'Already migrated',
        descriptionMarkdown: 'Already migrated',
      },
    ];
    const preservedContent = {
      contact: { name: 'Preserved', email: 'preserved@example.com', links: [] },
      skills: [],
      education: [{ institution: 'MIT' }],
      projects: [],
    };
    const cvs = [
      {
        id: 200,
        userId: 1,
        content: null,
        templateKey: null,
        lastSyncedFromProfileAt: null,
      },
      {
        id: 201,
        userId: 2,
        content: preservedContent,
        templateKey: 'structured-minimal',
        lastSyncedFromProfileAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ];

    for (const project of projects) {
      project.update = vi.fn(async (updates) => {
        Object.assign(project, updates);
      });
    }
    for (const cv of cvs) {
      cv.update = vi.fn(async (updates) => {
        Object.assign(cv, updates);
      });
    }

    User.findAll.mockImplementation(async ({ where }) =>
      candidates.filter((u) => u.role === where.role),
    );
    CandidateProfile.findAll.mockImplementation(async () => profiles.map((p) => ({ ...p })));
    CandidateProfile.create.mockImplementation(async (data) => {
      const row = { id: profiles.length + 20, ...data };
      profiles.push(row);
      return row;
    });
    Project.findAll.mockImplementation(async ({ where } = {}) => {
      if (where && Object.prototype.hasOwnProperty.call(where, 'descriptionMarkdown')) {
        return projects.filter((p) => p.descriptionMarkdown === where.descriptionMarkdown);
      }
      return projects;
    });
    Cv.findAll.mockImplementation(async ({ where } = {}) => {
      if (where && Object.prototype.hasOwnProperty.call(where, 'content')) {
        return cvs.filter((c) => c.content === where.content);
      }
      return cvs;
    });
    buildSnapshotFromProfile.mockImplementation(async (userId) => ({
      contact: { name: `User ${userId}`, email: `user${userId}@example.com`, links: [] },
      skills: [],
      education: [],
      projects: [],
    }));

    const first = await backfillCvSnapshots();
    expect(first).toEqual({
      profilesCreated: 1,
      projectsMigrated: 1,
      cvsBackfilled: 1,
    });
    expect(projects[0].descriptionMarkdown).toBe('Built fast');
    expect(projects[0].update).toHaveBeenCalledTimes(1);
    expect(cvs[0].content).toEqual({
      contact: { name: 'User 1', email: 'user1@example.com', links: [] },
      skills: [],
      education: [],
      projects: [],
    });
    expect(cvs[0].templateKey).toBe('editorial-sidebar');
    expect(cvs[0].lastSyncedFromProfileAt).toEqual(expect.any(Date));
    expect(cvs[0].update).toHaveBeenCalledTimes(1);

    expect(cvs[1].content).toBe(preservedContent);
    expect(cvs[1].templateKey).toBe('structured-minimal');
    expect(cvs[1].update).not.toHaveBeenCalled();

    const second = await backfillCvSnapshots();
    expect(second).toEqual({
      profilesCreated: 0,
      projectsMigrated: 0,
      cvsBackfilled: 0,
    });
    expect(projects[0].update).toHaveBeenCalledTimes(1);
    expect(cvs[0].update).toHaveBeenCalledTimes(1);
    expect(cvs[1].content).toBe(preservedContent);
    expect(buildSnapshotFromProfile).toHaveBeenCalledTimes(1);
    expect(validateCvContent).toHaveBeenCalled();
  });

  it('skips invalid profile-derived snapshots without persisting malformed content', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cv = {
      id: 300,
      userId: 9,
      content: null,
      templateKey: null,
      lastSyncedFromProfileAt: null,
      update: vi.fn(async (updates) => Object.assign(cv, updates)),
    };
    const invalidSnapshot = {
      contact: {
        name: 'Broken',
        links: [{ label: 'Bad', url: 'not-a-url' }],
      },
      skills: [],
      education: [],
      projects: [],
    };

    User.findAll.mockResolvedValue([]);
    CandidateProfile.findAll.mockResolvedValue([]);
    Project.findAll.mockResolvedValue([]);
    Cv.findAll.mockResolvedValue([cv]);
    buildSnapshotFromProfile.mockResolvedValue(invalidSnapshot);
    validateCvContent.mockImplementation(() => {
      throw new Error('Invalid url');
    });

    const result = await backfillCvSnapshots();

    expect(result.cvsBackfilled).toBe(0);
    expect(cv.update).not.toHaveBeenCalled();
    expect(cv.content).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('demotes a published CV to draft when the backfilled snapshot is incomplete', async () => {
    const incompleteSnapshot = {
      contact: { name: 'No Email', links: [] },
      skills: [],
      education: [],
      projects: [],
    };
    const cv = {
      id: 400,
      userId: 7,
      status: 'published',
      content: null,
      templateKey: null,
      lastSyncedFromProfileAt: null,
      update: vi.fn(async (updates) => Object.assign(cv, updates)),
    };

    User.findAll.mockResolvedValue([]);
    CandidateProfile.findAll.mockResolvedValue([]);
    Project.findAll.mockResolvedValue([]);
    Cv.findAll.mockResolvedValue([cv]);
    buildSnapshotFromProfile.mockResolvedValue(incompleteSnapshot);
    validateCvContent.mockImplementation((content) => content);

    const result = await backfillCvSnapshots();

    expect(result.cvsBackfilled).toBe(1);
    expect(cv.update).toHaveBeenCalledWith(
      expect.objectContaining({
        content: incompleteSnapshot,
        templateKey: 'editorial-sidebar',
        status: 'draft',
        lastSyncedFromProfileAt: expect.any(Date),
      }),
    );
    expect(cv.status).toBe('draft');
  });
});

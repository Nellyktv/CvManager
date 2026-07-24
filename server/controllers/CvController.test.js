import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Op } from 'sequelize';

const { Cv, Position, User, CandidateSkills, Project, Attribute } = vi.hoisted(() => ({
  Cv: {
    create: vi.fn(),
    findByPk: vi.fn(),
    findAll: vi.fn(),
  },
  Position: {
    findByPk: vi.fn(),
  },
  User: {},
  CandidateSkills: {
    findAll: vi.fn(),
  },
  Project: {
    findAll: vi.fn(),
  },
  Attribute: {},
}));

const { buildSnapshotFromProfile, mergeSnapshotSections, isSnapshotComplete } = vi.hoisted(() => ({
  buildSnapshotFromProfile: vi.fn(),
  mergeSnapshotSections: vi.fn(),
  isSnapshotComplete: vi.fn(),
}));

vi.mock('../models/models.js', () => ({
  Cv,
  Position,
  User,
  CandidateSkills,
  Project,
  Attribute,
}));

vi.mock('../service/cv-snapshot-service.js', () => ({
  buildSnapshotFromProfile,
  mergeSnapshotSections,
  isSnapshotComplete,
}));

const CvController = (await import('./CvController.js')).default;

const mockRes = () => {
  const res = {};
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

const completeContent = {
  contact: { name: 'Bob Candidate', email: 'bob@example.com', links: [] },
  skills: [{ label: 'React' }],
  education: [{ institution: 'BSUIR' }],
  projects: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CvController access control', () => {
  it('candidate A cannot list or read candidate B draft', async () => {
    Cv.findAll.mockResolvedValue([]);

    const listRes = mockRes();
    await CvController.getAllCv(
      { user: { id: 1, role: 'CANDIDATE' }, query: {} },
      listRes,
    );

    expect(Cv.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 1 }),
      }),
    );
    expect(listRes.json).toHaveBeenCalledWith({ allCv: [] });

    Cv.findByPk.mockResolvedValue({
      id: 20,
      userId: 2,
      status: 'draft',
      content: completeContent,
      position: { id: 5, title: 'FE' },
      user: { id: 2, firstName: 'Bob', lastName: 'B' },
    });

    await expect(
      CvController.getCv(
        { user: { id: 1, role: 'CANDIDATE' }, params: { id: '20' } },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('recruiter can read candidate B published CV but not draft', async () => {
    const published = {
      id: 21,
      userId: 2,
      status: 'published',
      content: completeContent,
      position: { id: 5, title: 'FE' },
      user: { id: 2, firstName: 'Bob', lastName: 'B' },
    };
    Cv.findByPk.mockResolvedValue(published);

    const res = mockRes();
    await CvController.getCv(
      { user: { id: 9, role: 'RECRUITER' }, params: { id: '21' } },
      res,
    );

    expect(res.json).toHaveBeenCalledWith({ cv: published });
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('attributes');
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('projects');
    expect(CandidateSkills.findAll).not.toHaveBeenCalled();
    expect(Project.findAll).not.toHaveBeenCalled();

    Cv.findByPk.mockResolvedValue({
      ...published,
      id: 22,
      status: 'draft',
    });

    await expect(
      CvController.getCv(
        { user: { id: 9, role: 'RECRUITER' }, params: { id: '22' } },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('create_resume rejects a candidate without PositionAccess', async () => {
    Position.findByPk.mockResolvedValue({
      id: 5,
      allowedCandidates: [{ id: 99 }],
    });

    await expect(
      CvController.createCv(
        { user: { id: 1, role: 'CANDIDATE' }, body: { positionId: 5 } },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(Cv.create).not.toHaveBeenCalled();
  });
});

describe('CvController mutation authorization', () => {
  const ownedByCandidate = (overrides = {}) => ({
    id: 10,
    userId: 2,
    status: 'draft',
    content: completeContent,
    templateKey: 'editorial-sidebar',
    update: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  });

  it('recruiter is denied update, refresh, publish, and delete', async () => {
    const cv = ownedByCandidate();
    Cv.findByPk.mockResolvedValue(cv);
    const recruiter = { id: 9, role: 'RECRUITER' };

    await expect(
      CvController.updateCv(
        { user: recruiter, params: { id: '10' }, body: { templateKey: 'structured-minimal' } },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      CvController.refreshCvFromProfile(
        { user: recruiter, params: { id: '10' }, body: { sections: ['skills'] } },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      CvController.publishCv({ user: recruiter, params: { id: '10' } }, mockRes()),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      CvController.deleteCv({ user: recruiter, params: { id: '10' } }, mockRes()),
    ).rejects.toMatchObject({ status: 403 });

    expect(cv.update).not.toHaveBeenCalled();
    expect(cv.destroy).not.toHaveBeenCalled();
    expect(buildSnapshotFromProfile).not.toHaveBeenCalled();
  });

  it('non-owner candidate is denied refresh, publish, and delete', async () => {
    const cv = ownedByCandidate();
    Cv.findByPk.mockResolvedValue(cv);
    const otherCandidate = { id: 1, role: 'CANDIDATE' };

    await expect(
      CvController.refreshCvFromProfile(
        { user: otherCandidate, params: { id: '10' }, body: { sections: ['skills'] } },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      CvController.publishCv({ user: otherCandidate, params: { id: '10' } }, mockRes()),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      CvController.deleteCv({ user: otherCandidate, params: { id: '10' } }, mockRes()),
    ).rejects.toMatchObject({ status: 403 });

    expect(cv.update).not.toHaveBeenCalled();
    expect(cv.destroy).not.toHaveBeenCalled();
    expect(buildSnapshotFromProfile).not.toHaveBeenCalled();
  });

  it('admin can update, refresh, publish, and delete another user CV', async () => {
    const update = vi.fn().mockImplementation(async function apply(patch) {
      Object.assign(this, patch);
      return this;
    });
    const destroy = vi.fn();
    const cv = ownedByCandidate({ update, destroy });
    Cv.findByPk.mockResolvedValue(cv);
    const admin = { id: 99, role: 'ADMIN' };

    const updateRes = mockRes();
    await CvController.updateCv(
      {
        user: admin,
        params: { id: '10' },
        body: { templateKey: 'structured-minimal' },
      },
      updateRes,
    );
    expect(update).toHaveBeenCalledWith({ templateKey: 'structured-minimal' });
    expect(updateRes.json).toHaveBeenCalledWith({ cv });

    buildSnapshotFromProfile.mockResolvedValue(completeContent);
    mergeSnapshotSections.mockReturnValue(completeContent);
    const refreshRes = mockRes();
    await CvController.refreshCvFromProfile(
      { user: admin, params: { id: '10' }, body: { sections: ['skills'] } },
      refreshRes,
    );
    expect(buildSnapshotFromProfile).toHaveBeenCalledWith(2);
    expect(refreshRes.json).toHaveBeenCalledWith({
      cv,
      refreshedAt: expect.any(String),
    });

    isSnapshotComplete.mockReturnValue(true);
    const publishRes = mockRes();
    await CvController.publishCv({ user: admin, params: { id: '10' } }, publishRes);
    expect(update).toHaveBeenCalledWith({ status: 'published' });
    expect(publishRes.json).toHaveBeenCalledWith({ message: 'CV published' });

    const deleteRes = mockRes();
    await CvController.deleteCv({ user: admin, params: { id: '10' } }, deleteRes);
    expect(destroy).toHaveBeenCalled();
    expect(deleteRes.json).toHaveBeenCalledWith({ message: 'CV deleted' });
  });
});

describe('CvController snapshot mutations', () => {
  it('PUT rejects a non-owner and malformed content', async () => {
    const update = vi.fn();
    Cv.findByPk.mockResolvedValue({
      id: 10,
      userId: 2,
      status: 'draft',
      content: completeContent,
      templateKey: 'editorial-sidebar',
      update,
    });

    await expect(
      CvController.updateCv(
        {
          user: { id: 1, role: 'CANDIDATE' },
          params: { id: '10' },
          body: { templateKey: 'structured-minimal' },
        },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(update).not.toHaveBeenCalled();

    Cv.findByPk.mockResolvedValue({
      id: 10,
      userId: 1,
      status: 'draft',
      content: completeContent,
      templateKey: 'editorial-sidebar',
      update,
    });

    await expect(
      CvController.updateCv(
        {
          user: { id: 1, role: 'CANDIDATE' },
          params: { id: '10' },
          body: {
            content: {
              contact: { name: 'X', links: [] },
              skills: [],
              education: [],
              projects: [
                {
                  title: 'Bad',
                  links: [],
                  descriptionMarkdown: '<script>alert(1)</script>',
                },
              ],
            },
          },
        },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(update).not.toHaveBeenCalled();
  });

  it('refresh only replaces requested sections', async () => {
    const existing = {
      contact: { name: 'Old', email: 'old@example.com', links: [] },
      skills: [{ label: 'Vue' }],
      education: [{ institution: 'Old U' }],
      projects: [{ title: 'Old Proj', links: [] }],
    };
    const defaults = {
      contact: { name: 'New', email: 'new@example.com', links: [] },
      skills: [{ label: 'React' }],
      education: [{ institution: 'New U' }],
      projects: [{ title: 'New Proj', links: [] }],
    };
    const merged = {
      ...existing,
      skills: defaults.skills,
      education: defaults.education,
    };
    const syncedAt = new Date('2026-07-24T12:00:00.000Z');
    const update = vi.fn().mockImplementation(async function apply(patch) {
      Object.assign(this, patch);
      return this;
    });
    const cv = {
      id: 10,
      userId: 1,
      status: 'draft',
      content: existing,
      templateKey: 'editorial-sidebar',
      lastSyncedFromProfileAt: null,
      update,
    };

    Cv.findByPk.mockResolvedValue(cv);
    buildSnapshotFromProfile.mockResolvedValue(defaults);
    mergeSnapshotSections.mockReturnValue(merged);

    const res = mockRes();
    await CvController.refreshCvFromProfile(
      {
        user: { id: 1, role: 'CANDIDATE' },
        params: { id: '10' },
        body: { sections: ['skills', 'education'] },
      },
      res,
    );

    expect(buildSnapshotFromProfile).toHaveBeenCalledWith(1);
    expect(mergeSnapshotSections).toHaveBeenCalledWith(existing, defaults, [
      'skills',
      'education',
    ]);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        content: merged,
        lastSyncedFromProfileAt: expect.any(Date),
      }),
    );
    expect(res.json).toHaveBeenCalledWith({
      cv: expect.objectContaining({ content: merged }),
      refreshedAt: expect.any(String),
    });
    expect(cv.lastSyncedFromProfileAt).toEqual(expect.any(Date));
    void syncedAt;

    await expect(
      CvController.refreshCvFromProfile(
        {
          user: { id: 1, role: 'CANDIDATE' },
          params: { id: '10' },
          body: { sections: [] },
        },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      CvController.refreshCvFromProfile(
        {
          user: { id: 1, role: 'CANDIDATE' },
          params: { id: '10' },
          body: { sections: ['workHistory'] },
        },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('admin refresh builds defaults from CV owner id, not admin id', async () => {
    const existing = {
      contact: { name: 'Owner', email: 'owner@example.com', links: [] },
      skills: [{ label: 'Vue' }],
      education: [],
      projects: [],
    };
    const defaults = {
      contact: { name: 'Owner', email: 'owner@example.com', links: [] },
      skills: [{ label: 'React' }],
      education: [],
      projects: [],
    };
    const update = vi.fn().mockImplementation(async function apply(patch) {
      Object.assign(this, patch);
      return this;
    });
    const cv = {
      id: 10,
      userId: 2,
      status: 'draft',
      content: existing,
      templateKey: 'editorial-sidebar',
      lastSyncedFromProfileAt: null,
      update,
    };

    Cv.findByPk.mockResolvedValue(cv);
    buildSnapshotFromProfile.mockResolvedValue(defaults);
    mergeSnapshotSections.mockReturnValue({
      ...existing,
      skills: defaults.skills,
    });

    await CvController.refreshCvFromProfile(
      {
        user: { id: 99, role: 'ADMIN' },
        params: { id: '10' },
        body: { sections: ['skills'] },
      },
      mockRes(),
    );

    expect(buildSnapshotFromProfile).toHaveBeenCalledWith(2);
    expect(buildSnapshotFromProfile).not.toHaveBeenCalledWith(99);
  });

  it('publish rejects an incomplete snapshot and accepts a complete one', async () => {
    const update = vi.fn();
    Cv.findByPk.mockResolvedValue({
      id: 10,
      userId: 1,
      status: 'draft',
      content: {
        contact: { name: 'Bob', links: [] },
        skills: [],
        education: [],
        projects: [],
      },
      update,
    });
    isSnapshotComplete.mockReturnValue(false);

    await expect(
      CvController.publishCv(
        { user: { id: 1, role: 'CANDIDATE' }, params: { id: '10' } },
        mockRes(),
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Complete required CV fields before publishing',
    });
    expect(update).not.toHaveBeenCalled();

    const completeUpdate = vi.fn();
    const completeCv = {
      id: 11,
      userId: 1,
      status: 'draft',
      content: completeContent,
      update: completeUpdate,
    };
    Cv.findByPk.mockResolvedValue(completeCv);
    isSnapshotComplete.mockReturnValue(true);

    const res = mockRes();
    await CvController.publishCv(
      { user: { id: 1, role: 'CANDIDATE' }, params: { id: '11' } },
      res,
    );

    expect(isSnapshotComplete).toHaveBeenCalledWith(completeContent);
    expect(completeUpdate).toHaveBeenCalledWith({ status: 'published' });
    expect(res.json).toHaveBeenCalledWith({ message: 'CV published' });
    expect(CandidateSkills.findAll).not.toHaveBeenCalled();
  });
});

describe('CvController create and tag search', () => {
  it('create_resume seeds editorial-sidebar snapshot from profile', async () => {
    Position.findByPk.mockResolvedValue({
      id: 5,
      allowedCandidates: [],
    });
    buildSnapshotFromProfile.mockResolvedValue(completeContent);
    const created = {
      id: 1,
      positionId: 5,
      userId: 1,
      templateKey: 'editorial-sidebar',
      content: completeContent,
      status: 'draft',
    };
    Cv.create.mockResolvedValue(created);

    const res = mockRes();
    await CvController.createCv(
      { user: { id: 1, role: 'CANDIDATE' }, body: { positionId: 5 } },
      res,
    );

    expect(buildSnapshotFromProfile).toHaveBeenCalledWith(1);
    expect(Cv.create).toHaveBeenCalledWith({
      positionId: 5,
      userId: 1,
      templateKey: 'editorial-sidebar',
      content: completeContent,
      lastSyncedFromProfileAt: expect.any(Date),
    });
    expect(res.json).toHaveBeenCalledWith({ cv: created });
  });

  it('create and refresh validate snapshot content before persist', async () => {
    Position.findByPk.mockResolvedValue({
      id: 5,
      allowedCandidates: [],
    });
    buildSnapshotFromProfile.mockResolvedValue({
      contact: { name: 'Bob', links: [{ label: 'Bad', url: 'ftp://example.com' }] },
      skills: [],
      education: [],
      projects: [],
    });

    await expect(
      CvController.createCv(
        { user: { id: 1, role: 'CANDIDATE' }, body: { positionId: 5 } },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(Cv.create).not.toHaveBeenCalled();

    const update = vi.fn();
    Cv.findByPk.mockResolvedValue({
      id: 10,
      userId: 1,
      status: 'draft',
      content: completeContent,
      update,
    });
    mergeSnapshotSections.mockReturnValue({
      contact: { name: 'Bob', links: [] },
      skills: [],
      education: [],
      projects: [
        {
          title: 'Bad',
          links: [],
          descriptionMarkdown: '<script>alert(1)</script>',
        },
      ],
    });

    await expect(
      CvController.refreshCvFromProfile(
        {
          user: { id: 1, role: 'CANDIDATE' },
          params: { id: '10' },
          body: { sections: ['projects'] },
        },
        mockRes(),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(update).not.toHaveBeenCalled();
  });

  it('tag search matches cv.content.skills and ignores later profile-skill edits', async () => {
    const snapshotCv = {
      id: 30,
      userId: 2,
      status: 'published',
      content: {
        ...completeContent,
        skills: [{ label: 'React' }],
      },
    };
    Cv.findAll.mockResolvedValue([snapshotCv]);

    const res = mockRes();
    await CvController.getAllCv(
      { user: { id: 9, role: 'RECRUITER' }, query: { tag: 'React' } },
      res,
    );

    expect(CandidateSkills.findAll).not.toHaveBeenCalled();
    expect(Cv.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'published',
          content: {
            [Op.contains]: { skills: [{ label: 'React' }] },
          },
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith({ allCv: [snapshotCv] });

    CandidateSkills.findAll.mockResolvedValue([
      { userId: 2, attribute: { name: 'Go' } },
    ]);

    Cv.findAll.mockClear();
    CandidateSkills.findAll.mockClear();
    Cv.findAll.mockResolvedValue([snapshotCv]);

    const res2 = mockRes();
    await CvController.getAllCv(
      { user: { id: 9, role: 'RECRUITER' }, query: { tag: 'React' } },
      res2,
    );

    expect(CandidateSkills.findAll).not.toHaveBeenCalled();
    expect(res2.json).toHaveBeenCalledWith({ allCv: [snapshotCv] });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { CandidateProfile, Education, Project } = vi.hoisted(() => ({
  CandidateProfile: {
    findOne: vi.fn(),
    create: vi.fn(),
    findOrCreate: vi.fn(),
  },
  Education: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  Project: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../models/models.js', () => ({
  CandidateProfile,
  Education,
  Project,
}));

const CandidateProfileController = (await import('./CandidateProfileController.js')).default;
const EducationController = (await import('./EducationController.js')).default;
const ProjectController = (await import('./ProjectController.js')).default;
const { ApiError } = await import('../errors/ApiError.js');

const mockRes = () => {
  const res = {};
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CandidateProfileController', () => {
  it('GET creates/returns an empty row only for the authenticated user', async () => {
    const created = {
      id: 1,
      userId: 42,
      headline: null,
      publicEmail: null,
      phone: null,
      location: null,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
    };
    CandidateProfile.findOne.mockResolvedValue(null);
    CandidateProfile.create.mockResolvedValue(created);

    const req = { user: { id: 42 } };
    const res = mockRes();
    const next = mockNext();

    await CandidateProfileController.getProfile(req, res, next);

    expect(CandidateProfile.findOne).toHaveBeenCalledWith({ where: { userId: 42 } });
    expect(CandidateProfile.create).toHaveBeenCalledWith({ userId: 42 });
    expect(res.json).toHaveBeenCalledWith({ profile: created });
  });

  it('PUT rejects malformed publicEmail and invalid professional URLs', async () => {
    const reqEmail = {
      user: { id: 42 },
      body: { publicEmail: 'not-an-email' },
    };
    const res = mockRes();
    const next = mockNext();

    await expect(
      CandidateProfileController.updateProfile(reqEmail, res, next),
    ).rejects.toMatchObject({ status: 400 });
    expect(next).not.toHaveBeenCalled();
    expect(CandidateProfile.findOne).not.toHaveBeenCalled();

    const reqUrl = {
      user: { id: 42 },
      body: { linkedinUrl: 'ftp://not-http.example.com' },
    };

    await expect(
      CandidateProfileController.updateProfile(reqUrl, res, next),
    ).rejects.toMatchObject({ status: 400 });
    expect(CandidateProfile.findOne).not.toHaveBeenCalled();
  });
});

describe('EducationController', () => {
  it('PUT /education/:id returns 403 when education.userId !== req.user.id', async () => {
    Education.findByPk.mockResolvedValue({
      id: 9,
      userId: 99,
      institution: 'BSUIR',
      update: vi.fn(),
    });

    const req = {
      user: { id: 42 },
      params: { id: '9' },
      body: { institution: 'MIT' },
    };
    const res = mockRes();
    const next = mockNext();

    await expect(EducationController.updateEducation(req, res, next)).rejects.toMatchObject({
      status: 403,
    });
    expect(Education.findByPk).toHaveBeenCalledWith('9');
  });

  it('rejects non-integer displayOrder and an invalid date range', async () => {
    const res = mockRes();
    const next = mockNext();

    await expect(
      EducationController.createEducation(
        {
          user: { id: 42 },
          body: { institution: 'BSUIR', displayOrder: 1.5 },
        },
        res,
        next,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(Education.create).not.toHaveBeenCalled();

    await expect(
      EducationController.createEducation(
        {
          user: { id: 42 },
          body: {
            institution: 'BSUIR',
            startDate: '2024-06-01',
            endDate: '2023-01-01',
          },
        },
        res,
        next,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(Education.create).not.toHaveBeenCalled();
  });

  it('DELETE returns 403 when education.userId !== req.user.id', async () => {
    Education.findByPk.mockResolvedValue({
      id: 9,
      userId: 99,
      destroy: vi.fn(),
    });

    await expect(
      EducationController.deleteEducation(
        { user: { id: 42 }, params: { id: '9' } },
        mockRes(),
        mockNext(),
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(Education.findByPk).toHaveBeenCalledWith('9');
  });

  it('update rejects endDate before existing startDate on partial payload', async () => {
    const update = vi.fn();
    Education.findByPk.mockResolvedValue({
      id: 9,
      userId: 42,
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      update,
    });

    await expect(
      EducationController.updateEducation(
        {
          user: { id: 42 },
          params: { id: '9' },
          body: { endDate: '2022-01-01' },
        },
        mockRes(),
        mockNext(),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(update).not.toHaveBeenCalled();
  });
});

describe('ProjectController', () => {
  it('update rejects a link with an invalid URL', async () => {
    Project.findByPk.mockResolvedValue({
      id: 3,
      userId: 42,
      update: vi.fn(),
    });

    const req = {
      user: { id: 42 },
      params: { id: '3' },
      body: {
        title: 'CV Manager',
        links: [{ label: 'Repo', url: 'not-a-url' }],
      },
    };
    const res = mockRes();
    const next = mockNext();

    await expect(ProjectController.updateProject(req, res, next)).rejects.toMatchObject({
      status: 400,
    });
  });

  it('update rejects raw HTML in descriptionMarkdown and non-integer displayOrder', async () => {
    Project.findByPk.mockResolvedValue({
      id: 3,
      userId: 42,
      update: vi.fn(),
    });

    const res = mockRes();
    const next = mockNext();

    await expect(
      ProjectController.updateProject(
        {
          user: { id: 42 },
          params: { id: '3' },
          body: { descriptionMarkdown: 'Built <strong>fast</strong>' },
        },
        res,
        next,
      ),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      ProjectController.updateProject(
        {
          user: { id: 42 },
          params: { id: '3' },
          body: { displayOrder: 2.25 },
        },
        res,
        next,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('list returns displayOrder ascending', async () => {
    const projects = [
      { id: 2, displayOrder: 1, descriptionMarkdown: 'First', description: null },
      { id: 1, displayOrder: 2, descriptionMarkdown: null, description: 'Legacy' },
    ];
    Project.findAll.mockResolvedValue(projects);

    const req = { user: { id: 42 } };
    const res = mockRes();
    const next = mockNext();

    await ProjectController.getMyProjects(req, res, next);

    expect(Project.findAll).toHaveBeenCalledWith({
      where: { userId: 42 },
      order: [
        ['displayOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    expect(res.json).toHaveBeenCalledWith({
      projects: [
        { id: 2, displayOrder: 1, descriptionMarkdown: 'First', description: null },
        { id: 1, displayOrder: 2, descriptionMarkdown: 'Legacy', description: 'Legacy' },
      ],
    });
  });

  it('create/update accept legacy description and map it to descriptionMarkdown without dual-write', async () => {
    Project.create.mockResolvedValue({
      id: 5,
      title: 'CV Manager',
      description: null,
      descriptionMarkdown: 'Legacy text',
      userId: 42,
    });

    const createRes = mockRes();
    await ProjectController.createProject(
      { user: { id: 42 }, body: { title: 'CV Manager', description: 'Legacy text' } },
      createRes,
      mockNext(),
    );

    expect(Project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'CV Manager',
        descriptionMarkdown: 'Legacy text',
        userId: 42,
      }),
    );
    expect(Project.create.mock.calls[0][0]).not.toHaveProperty('description');
    expect(createRes.json).toHaveBeenCalledWith({
      project: expect.objectContaining({ descriptionMarkdown: 'Legacy text' }),
    });

    const update = vi.fn().mockResolvedValue(undefined);
    const project = {
      id: 5,
      userId: 42,
      description: 'Old',
      descriptionMarkdown: null,
      update,
      toJSON() {
        return {
          id: 5,
          userId: 42,
          description: 'Old',
          descriptionMarkdown: 'Updated legacy',
        };
      },
    };
    Project.findByPk.mockResolvedValue(project);
    update.mockImplementation(async (fields) => {
      Object.assign(project, fields);
    });

    const updateRes = mockRes();
    await ProjectController.updateProject(
      {
        user: { id: 42 },
        params: { id: '5' },
        body: { description: 'Updated legacy' },
      },
      updateRes,
      mockNext(),
    );

    expect(update).toHaveBeenCalledWith({
      descriptionMarkdown: 'Updated legacy',
    });
    expect(update.mock.calls[0][0]).not.toHaveProperty('description');
  });

  it('read falls back to legacy description when markdown is empty', async () => {
    Project.findAll.mockResolvedValue([
      { id: 1, displayOrder: 0, descriptionMarkdown: '', description: 'Legacy only' },
    ]);

    const res = mockRes();
    await ProjectController.getMyProjects({ user: { id: 42 } }, res, mockNext());

    expect(res.json).toHaveBeenCalledWith({
      projects: [
        {
          id: 1,
          displayOrder: 0,
          descriptionMarkdown: 'Legacy only',
          description: 'Legacy only',
        },
      ],
    });
  });

  it('update rejects endDate before existing startDate on partial payload', async () => {
    const update = vi.fn();
    Project.findByPk.mockResolvedValue({
      id: 3,
      userId: 42,
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      update,
    });

    await expect(
      ProjectController.updateProject(
        {
          user: { id: 42 },
          params: { id: '3' },
          body: { endDate: '2022-06-01' },
        },
        mockRes(),
        mockNext(),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(update).not.toHaveBeenCalled();
  });
});

describe('ApiError shape', () => {
  it('ownership and validation failures are ApiError instances', async () => {
    Education.findByPk.mockResolvedValue({
      id: 9,
      userId: 99,
      institution: 'BSUIR',
      update: vi.fn(),
    });

    await expect(
      EducationController.updateEducation(
        { user: { id: 42 }, params: { id: '9' }, body: { institution: 'MIT' } },
        mockRes(),
        mockNext(),
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

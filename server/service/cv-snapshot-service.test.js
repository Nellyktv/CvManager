import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  User,
  CandidateProfile,
  CandidateSkills,
  Education,
  Project,
  Attribute,
} = vi.hoisted(() => ({
  User: { findByPk: vi.fn() },
  CandidateProfile: { findOne: vi.fn() },
  CandidateSkills: { findAll: vi.fn() },
  Education: { findAll: vi.fn() },
  Project: { findAll: vi.fn() },
  Attribute: {},
}));

vi.mock('../models/models.js', () => ({
  User,
  CandidateProfile,
  CandidateSkills,
  Education,
  Project,
  Attribute,
}));

const {
  buildSnapshotFromProfile,
  mergeSnapshotSections,
  isSnapshotComplete,
} = await import('./cv-snapshot-service.js');

const { sanitizeLegacyMarkdown, validateCvContent, validateCvUpdate, cvTemplateKeys } =
  await import('../schemas/cvContentSchema.js');

const baseExisting = {
  contact: {
    name: 'Old Name',
    email: 'old@example.com',
    links: [{ label: 'Old', url: 'https://old.example.com' }],
  },
  skills: [{ label: 'Vue' }],
  education: [{ institution: 'Old Uni' }],
  projects: [{ title: 'Old Project', links: [] }],
};

const baseDefaults = {
  contact: {
    name: 'Artem Ilyin',
    email: 'artem@example.com',
    headline: 'Engineer',
    links: [{ label: 'GitHub', url: 'https://github.com/artem' }],
  },
  skills: [{ label: 'React', value: 'advanced' }],
  education: [{ institution: 'BSUIR', degree: 'BSc' }],
  projects: [
    {
      title: 'CV Manager',
      links: [{ label: 'Repo', url: 'https://github.com/artem/cv' }],
      descriptionMarkdown: 'Built **it**.',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildSnapshotFromProfile', () => {
  it('maps profile defaults into a detached CvContent snapshot', async () => {
    User.findByPk.mockResolvedValue({
      id: 7,
      firstName: 'Artem',
      lastName: 'Ilyin',
      email: 'secret@account.com',
      password: 'hashed-secret',
    });
    CandidateProfile.findOne.mockResolvedValue({
      publicEmail: 'artem@example.com',
      headline: null,
      phone: null,
      location: null,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
    });
    CandidateSkills.findAll.mockResolvedValue([
      { value: 'advanced', attribute: { name: 'React' } },
    ]);
    Education.findAll.mockResolvedValue([{ institution: 'BSUIR' }]);
    Project.findAll.mockResolvedValue([
      {
        title: 'CV Manager',
        links: null,
        descriptionMarkdown: 'Built **it**.',
      },
    ]);

    await expect(buildSnapshotFromProfile(7)).resolves.toEqual({
      contact: { name: 'Artem Ilyin', email: 'artem@example.com', links: [] },
      skills: [{ label: 'React', value: 'advanced' }],
      education: [{ institution: 'BSUIR' }],
      projects: [{ title: 'CV Manager', links: [], descriptionMarkdown: 'Built **it**.' }],
    });

    expect(User.findByPk).toHaveBeenCalledWith(7, {
      attributes: ['id', 'firstName', 'lastName'],
    });
    expect(Education.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7 },
        order: [
          ['displayOrder', 'ASC'],
          ['id', 'ASC'],
        ],
      }),
    );
    expect(Project.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7 },
        order: [
          ['displayOrder', 'ASC'],
          ['id', 'ASC'],
        ],
      }),
    );
  });

  it('normalizes nullables, omits missing optionals, and drops untitled projects', async () => {
    User.findByPk.mockResolvedValue({
      id: 7,
      firstName: null,
      lastName: 'Ilyin',
    });
    CandidateProfile.findOne.mockResolvedValue({
      publicEmail: null,
      headline: null,
      phone: '  ',
      location: null,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
    });
    CandidateSkills.findAll.mockResolvedValue([
      { value: null, attribute: { name: 'TypeScript' } },
      { value: '  ', attribute: { name: 'Node' } },
    ]);
    Education.findAll.mockResolvedValue([
      {
        institution: 'BSUIR',
        degree: null,
        field: null,
        location: null,
        startDate: null,
        endDate: null,
        description: null,
      },
    ]);
    Project.findAll.mockResolvedValue([
      {
        title: '  ',
        role: 'Lead',
        links: null,
        descriptionMarkdown: 'Ignored',
      },
      {
        title: null,
        links: [{ label: 'Repo', url: 'https://example.com' }],
      },
      {
        title: 'Kept',
        role: null,
        startDate: null,
        endDate: null,
        links: null,
        descriptionMarkdown: null,
      },
    ]);

    const snapshot = await buildSnapshotFromProfile(7);

    expect(snapshot.contact).toEqual({ name: 'Ilyin', links: [] });
    expect(snapshot.contact.name).not.toContain('null');
    expect(snapshot.skills).toEqual([{ label: 'TypeScript' }, { label: 'Node' }]);
    expect(snapshot.education).toEqual([{ institution: 'BSUIR' }]);
    expect(snapshot.projects).toEqual([{ title: 'Kept', links: [] }]);
    expect(snapshot).not.toHaveProperty('contact.email');
    expect(JSON.stringify(snapshot)).not.toMatch(/"password"/);
  });

  it('falls back from null descriptionMarkdown to sanitized legacy description', async () => {
    User.findByPk.mockResolvedValue({ id: 7, firstName: 'Artem', lastName: 'Ilyin' });
    CandidateProfile.findOne.mockResolvedValue({ publicEmail: 'artem@example.com' });
    CandidateSkills.findAll.mockResolvedValue([]);
    Education.findAll.mockResolvedValue([]);
    Project.findAll.mockResolvedValue([
      {
        title: 'Legacy',
        links: null,
        descriptionMarkdown: null,
        description: 'Built <strong>fast</strong>',
      },
      {
        title: 'Empty markdown',
        links: null,
        descriptionMarkdown: '',
        description: 'From <em>legacy</em>',
      },
      {
        title: 'Markdown preferred',
        links: null,
        descriptionMarkdown: 'Already **markdown**',
        description: 'Legacy ignored',
      },
    ]);

    const snapshot = await buildSnapshotFromProfile(7);

    expect(snapshot.projects).toEqual([
      { title: 'Legacy', links: [], descriptionMarkdown: 'Built fast' },
      { title: 'Empty markdown', links: [], descriptionMarkdown: 'From legacy' },
      {
        title: 'Markdown preferred',
        links: [],
        descriptionMarkdown: 'Already **markdown**',
      },
    ]);
  });

  it('builds contact links from profile URLs and never exposes credentials', async () => {
    User.findByPk.mockResolvedValue({
      id: 7,
      firstName: 'Artem',
      lastName: null,
      password: 'should-not-leak',
    });
    CandidateProfile.findOne.mockResolvedValue({
      publicEmail: 'artem@example.com',
      headline: 'Engineer',
      phone: '+375',
      location: 'Minsk',
      linkedinUrl: 'https://linkedin.com/in/artem',
      githubUrl: 'https://github.com/artem',
      portfolioUrl: 'https://artem.dev',
    });
    CandidateSkills.findAll.mockResolvedValue([]);
    Education.findAll.mockResolvedValue([]);
    Project.findAll.mockResolvedValue([]);

    const snapshot = await buildSnapshotFromProfile(7);

    expect(snapshot.contact).toEqual({
      name: 'Artem',
      email: 'artem@example.com',
      headline: 'Engineer',
      phone: '+375',
      location: 'Minsk',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/artem' },
        { label: 'GitHub', url: 'https://github.com/artem' },
        { label: 'Portfolio', url: 'https://artem.dev' },
      ],
    });
    expect(snapshot).not.toHaveProperty('password');
    expect(JSON.stringify(snapshot)).not.toContain('should-not-leak');
  });
});

describe('mergeSnapshotSections', () => {
  it('replaces only requested sections without mutating existing', () => {
    const existingCopy = structuredClone(baseExisting);
    const defaultsCopy = structuredClone(baseDefaults);

    const next = mergeSnapshotSections(baseExisting, baseDefaults, ['skills', 'education']);

    expect(next.contact).toEqual(baseExisting.contact);
    expect(next.projects).toEqual(baseExisting.projects);
    expect(next.skills).toEqual(baseDefaults.skills);
    expect(next.education).toEqual(baseDefaults.education);
    expect(baseExisting).toEqual(existingCopy);
    expect(baseDefaults).toEqual(defaultsCopy);
    expect(next).not.toBe(baseExisting);
    expect(next.skills).not.toBe(baseDefaults.skills);
  });
});

describe('isSnapshotComplete', () => {
  it('requires name, email, and one education item', () => {
    const complete = {
      contact: { name: 'Artem Ilyin', email: 'artem@example.com', links: [] },
      skills: [],
      education: [{ institution: 'BSUIR' }],
      projects: [],
    };

    expect(isSnapshotComplete(complete)).toBe(true);
    expect(
      isSnapshotComplete({
        ...complete,
        contact: { ...complete.contact, email: '' },
      }),
    ).toBe(false);
    expect(isSnapshotComplete({ ...complete, education: [] })).toBe(false);
    expect(
      isSnapshotComplete({
        ...complete,
        contact: { ...complete.contact, name: '   ' },
      }),
    ).toBe(false);
  });

  it('requires at least one education entry with a nonblank institution', () => {
    const complete = {
      contact: { name: 'Artem Ilyin', email: 'artem@example.com', links: [] },
      skills: [],
      education: [{ institution: 'BSUIR' }],
      projects: [],
    };

    expect(isSnapshotComplete({ ...complete, education: [{ institution: '' }] })).toBe(false);
    expect(isSnapshotComplete({ ...complete, education: [{ institution: '   ' }] })).toBe(false);
    expect(
      isSnapshotComplete({
        ...complete,
        education: [{ institution: '   ' }, { institution: 'BSUIR' }],
      }),
    ).toBe(true);
  });
});

describe('cvContentSchema', () => {
  it('exports template keys and validates content updates', () => {
    expect(cvTemplateKeys).toEqual(['editorial-sidebar', 'structured-minimal']);

    const content = {
      contact: { name: 'Artem Ilyin', email: 'artem@example.com', links: [] },
      skills: [],
      education: [{ institution: 'BSUIR' }],
      projects: [{ title: 'CV Manager', links: [], descriptionMarkdown: 'Built **it**.' }],
    };

    expect(validateCvContent(content)).toEqual(content);
    expect(validateCvUpdate({ templateKey: 'editorial-sidebar', content })).toEqual({
      templateKey: 'editorial-sidebar',
      content,
    });
    expect(validateCvUpdate({ templateKey: 'structured-minimal' })).toEqual({
      templateKey: 'structured-minimal',
    });
  });

  it('rejects HTML markdown, invalid links, and unknown template keys', () => {
    expect(() =>
      validateCvContent({
        contact: { name: 'A', links: [] },
        skills: [],
        education: [],
        projects: [
          {
            title: 'Bad',
            links: [],
            descriptionMarkdown: 'Built <strong>it</strong>.',
          },
        ],
      }),
    ).toThrow();

    expect(() =>
      validateCvContent({
        contact: {
          name: 'A',
          links: [{ label: 'Bad', url: 'ftp://example.com' }],
        },
        skills: [],
        education: [],
        projects: [],
      }),
    ).toThrow();

    expect(() => validateCvUpdate({ templateKey: 'fancy-custom' })).toThrow();
  });

  it('sanitizes legacy markdown by stripping tags and keeping text', () => {
    expect(sanitizeLegacyMarkdown('Built <strong>fast</strong>')).toBe('Built fast');
    expect(sanitizeLegacyMarkdown('A <em>B</em> <br/> C')).toBe('A B  C');
    expect(sanitizeLegacyMarkdown(null)).toBe('');
  });

  it('keeps TypeScript generics while stripping real HTML tags', () => {
    expect(sanitizeLegacyMarkdown('Returns Array<T> and Map<string, number>.')).toBe(
      'Returns Array<T> and Map<string, number>.',
    );
    expect(sanitizeLegacyMarkdown('Built <strong>Array<T></strong>')).toBe('Built Array<T>');

    expect(() =>
      validateCvContent({
        contact: { name: 'A', links: [] },
        skills: [],
        education: [],
        projects: [
          {
            title: 'Generics',
            links: [],
            descriptionMarkdown: 'Uses Array<T> and Map<string, number>.',
          },
        ],
      }),
    ).not.toThrow();

    expect(() =>
      validateCvContent({
        contact: { name: 'A', links: [] },
        skills: [],
        education: [],
        projects: [
          {
            title: 'HTML',
            links: [],
            descriptionMarkdown: 'Built <strong>fast</strong>.',
          },
        ],
      }),
    ).toThrow(/html/i);
  });

  it('keeps single-letter HTML-name type parameters while stripping real tags', () => {
    expect(sanitizeLegacyMarkdown('Types: List<a>, Box<i>, Foo<p>, Foo<var>.')).toBe(
      'Types: List<a>, Box<i>, Foo<p>, Foo<var>.',
    );
    expect(
      sanitizeLegacyMarkdown('See <a href="https://example.com">List<a></a> and <i>x</i>.'),
    ).toBe('See List<a> and x.');

    expect(() =>
      validateCvContent({
        contact: { name: 'A', links: [] },
        skills: [],
        education: [],
        projects: [
          {
            title: 'Short generics',
            links: [],
            descriptionMarkdown: 'Types: List<a>, Box<i>, Foo<p>, Foo<var>.',
          },
        ],
      }),
    ).not.toThrow();

    expect(() =>
      validateCvContent({
        contact: { name: 'A', links: [] },
        skills: [],
        education: [],
        projects: [
          {
            title: 'Real tags',
            links: [],
            descriptionMarkdown: 'See <a href="https://example.com">link</a> and <p>para</p>.',
          },
        ],
      }),
    ).toThrow(/html/i);
  });
});

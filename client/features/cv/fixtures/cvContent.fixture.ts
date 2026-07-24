import type { CvContent } from '../../../shared/types/cv';

/** Shared snapshot used by both web preview template tests. */
export const cvContentFixture: CvContent = {
  contact: {
    name: 'Artem Ilyin',
    headline: 'Frontend Engineer',
    email: 'artem@example.com',
    phone: '+370 600 00000',
    location: 'Vilnius, Lithuania',
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/example' },
      { label: 'GitHub', url: 'https://github.com/example' },
      { label: 'Portfolio', url: 'https://example.dev' },
    ],
  },
  skills: [
    { label: 'TypeScript', value: 'Advanced', group: 'Languages' },
    { label: 'React', group: 'Frameworks' },
    { label: 'Git' },
  ],
  education: [
    {
      institution: 'BSUIR',
      degree: 'BSc',
      field: 'Computer Science',
      location: 'Minsk',
      startDate: '2018-09-01',
      endDate: '2022-06-30',
      description: 'Software engineering track',
    },
  ],
  projects: [
    {
      title: 'CV Manager',
      role: 'Full-stack developer',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      links: [{ label: 'Repo', url: 'https://github.com/example/cv-manager' }],
      descriptionMarkdown:
        'Built a **CV workspace** with *preview* and PDF export.\n\n- Templates\n- Snapshots\n\nSee [docs](https://example.dev/docs).',
    },
  ],
};

import { describe, expect, it } from 'vitest';
import {
  createProjectFormSchema,
  cvContentSchema,
  cvTemplateKeySchema,
  validateCvContent,
  validateCvTemplateKey,
} from './cvSchemas';

const validContent = {
  contact: {
    name: 'Artem Ilyin',
    email: 'artem@example.com',
    links: [{ label: 'GitHub', url: 'https://github.com/artem' }],
  },
  skills: [{ label: 'React' }],
  education: [{ institution: 'BSUIR' }],
  projects: [
    {
      title: 'CV Manager',
      links: [],
      descriptionMarkdown: 'Built **it** with _care_.',
    },
  ],
};

describe('cvSchemas', () => {
  it('accepts valid CvContent and supported template keys', () => {
    expect(validateCvContent(validContent)).toEqual(validContent);
    expect(validateCvTemplateKey('editorial-sidebar')).toBe('editorial-sidebar');
    expect(validateCvTemplateKey('structured-minimal')).toBe('structured-minimal');
    expect(cvTemplateKeySchema.safeParse('editorial-sidebar').success).toBe(true);
  });

  it('rejects invalid URLs, unsupported template keys, and malformed CvContent', () => {
    expect(() =>
      validateCvContent({
        ...validContent,
        contact: {
          ...validContent.contact,
          links: [{ label: 'Bad', url: 'ftp://example.com' }],
        },
      }),
    ).toThrow();

    expect(() =>
      validateCvContent({
        ...validContent,
        contact: {
          ...validContent.contact,
          links: [{ label: 'Bad', url: 'not-a-url' }],
        },
      }),
    ).toThrow();

    expect(() => validateCvTemplateKey('fancy-custom')).toThrow();
    expect(cvTemplateKeySchema.safeParse('fancy-custom').success).toBe(false);

    expect(() =>
      validateCvContent({
        ...validContent,
        skills: 'React',
      }),
    ).toThrow();

    expect(() =>
      validateCvContent({
        ...validContent,
        education: null,
      }),
    ).toThrow();

    expect(() =>
      validateCvContent({
        ...validContent,
        projects: [
          {
            title: 'Bad',
            links: [],
            descriptionMarkdown: 'Built <strong>it</strong>.',
          },
        ],
      }),
    ).toThrow();

    expect(cvContentSchema.safeParse({ contact: { name: 'X' } }).success).toBe(false);
  });

  it('createProjectFormSchema rejects raw HTML in descriptionMarkdown', () => {
    const schema = createProjectFormSchema({
      titleRequired: 'Project title is required',
      invalidUrl: 'Enter a valid URL',
      invalidDateRange: 'End date must be on or after start date',
      markdownNoHtml: 'Markdown must not contain HTML tags',
    });

    const result = schema.safeParse({
      title: 'CV Manager',
      role: '',
      startDate: '',
      endDate: '',
      links: [],
      descriptionMarkdown: 'Built <strong>it</strong>.',
      displayOrder: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => /html/i.test(issue.message))).toBe(
        true,
      );
    }
  });

  it('accepts TypeScript generics in descriptionMarkdown but rejects real HTML tags', () => {
    expect(() =>
      validateCvContent({
        ...validContent,
        projects: [
          {
            title: 'Generics',
            links: [],
            descriptionMarkdown: 'Returns Array<T> and Map<string, number>.',
          },
        ],
      }),
    ).not.toThrow();

    expect(() =>
      validateCvContent({
        ...validContent,
        projects: [
          {
            title: 'HTML',
            links: [],
            descriptionMarkdown: 'Built <strong>fast</strong> with <br/> breaks.',
          },
        ],
      }),
    ).toThrow(/html/i);

    const schema = createProjectFormSchema({
      titleRequired: 'Project title is required',
      invalidUrl: 'Enter a valid URL',
      invalidDateRange: 'End date must be on or after start date',
      markdownNoHtml: 'Markdown must not contain HTML tags',
    });

    expect(
      schema.safeParse({
        title: 'CV Manager',
        role: '',
        startDate: '',
        endDate: '',
        links: [],
        descriptionMarkdown: 'Uses Promise<Response> and Record<string, number>.',
        displayOrder: '',
      }).success,
    ).toBe(true);
  });

  it('accepts single-letter HTML-name type parameters in generics', () => {
    expect(() =>
      validateCvContent({
        ...validContent,
        projects: [
          {
            title: 'Short generics',
            links: [],
            descriptionMarkdown: 'Types: List<a>, Box<i>, Foo<p>, Foo<var>.',
          },
        ],
      }),
    ).not.toThrow();

    const schema = createProjectFormSchema({
      titleRequired: 'Project title is required',
      invalidUrl: 'Enter a valid URL',
      invalidDateRange: 'End date must be on or after start date',
      markdownNoHtml: 'Markdown must not contain HTML tags',
    });

    expect(
      schema.safeParse({
        title: 'CV Manager',
        role: '',
        startDate: '',
        endDate: '',
        links: [],
        descriptionMarkdown: 'Uses List<a> and Foo<p>.',
        displayOrder: '',
      }).success,
    ).toBe(true);

    expect(() =>
      validateCvContent({
        ...validContent,
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

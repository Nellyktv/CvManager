import { z } from 'zod';

const httpUrl = z.httpUrl();

const HTML_TAG_NAMES = new Set([
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'search',
  'section',
  'select',
  'slot',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
]);

const TAG_CANDIDATE_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

const isIdentifierChar = (ch: string) => /[A-Za-z0-9_$]/.test(ch);

const isActualHtmlTag = (value: string, full: string, name: string, index: number) => {
  if (!HTML_TAG_NAMES.has(name.toLowerCase())) return false;
  if (full.startsWith('</')) return true;
  const afterName = full.slice(full.toLowerCase().indexOf(name.toLowerCase()) + name.length, -1);
  if (/[^\s/]/.test(afterName) || afterName.includes('/')) return true;
  if (index === 0) return true;
  return !isIdentifierChar(value[index - 1]!);
};

export const containsHtmlTags = (value: string) => {
  TAG_CANDIDATE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_CANDIDATE_RE.exec(value)) !== null) {
    if (isActualHtmlTag(value, match[0], match[1]!, match.index)) return true;
  }
  return false;
};

const markdownText = z.string().refine((value) => !containsHtmlTags(value), {
  error: 'Markdown must not contain HTML tags',
});

export const cvTemplateKeySchema = z.enum(['editorial-sidebar', 'structured-minimal']);

export const cvLinkSchema = z.object({
  label: z.string(),
  url: httpUrl,
});

export const cvContentSchema = z.object({
  contact: z.object({
    name: z.string(),
    headline: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(cvLinkSchema),
  }),
  skills: z.array(
    z.object({
      label: z.string(),
      value: z.string().optional(),
      group: z.string().optional(),
    }),
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      role: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      links: z.array(cvLinkSchema),
      descriptionMarkdown: markdownText.optional(),
    }),
  ),
});

export const validateCvContent = (content: unknown) => cvContentSchema.parse(content);

export const validateCvTemplateKey = (templateKey: unknown) =>
  cvTemplateKeySchema.parse(templateKey);

export type CandidateProfileFormMessages = {
  invalidEmail: string;
  invalidUrl: string;
};

export const createCandidateProfileFormSchema = (messages: CandidateProfileFormMessages) => {
  const optionalEmailField = z
    .string()
    .optional()
    .refine((value) => !value || z.email().safeParse(value).success, {
      error: messages.invalidEmail,
    });

  const optionalUrlField = z
    .string()
    .optional()
    .refine((value) => !value || httpUrl.safeParse(value).success, {
      error: messages.invalidUrl,
    });

  return z.object({
    headline: z.string().optional(),
    publicEmail: optionalEmailField,
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedinUrl: optionalUrlField,
    githubUrl: optionalUrlField,
    portfolioUrl: optionalUrlField,
  });
};

export type ProjectFormMessages = {
  titleRequired: string;
  invalidUrl: string;
  invalidDateRange: string;
  markdownNoHtml: string;
};

export const createProjectFormSchema = (messages: ProjectFormMessages) =>
  z
    .object({
      title: z.string().trim().min(1, { error: messages.titleRequired }),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      links: z.array(
        z.object({
          label: z.string(),
          url: z.string().refine((value) => httpUrl.safeParse(value).success, {
            error: messages.invalidUrl,
          }),
        }),
      ),
      descriptionMarkdown: z.string().refine((value) => !containsHtmlTags(value), {
        error: messages.markdownNoHtml,
      }),
      displayOrder: z.string(),
    })
    .refine(
      (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate,
      {
        error: messages.invalidDateRange,
        path: ['endDate'],
      },
    );

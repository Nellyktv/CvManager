import { z } from 'zod';

export const cvTemplateKeys = ['editorial-sidebar', 'structured-minimal'] as const;

const httpUrl = z.httpUrl().max(2048);
const shortText = z.string().max(255);

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
  return !isIdentifierChar(value[index - 1]);
};

export const containsHtmlTags = (value: string) => {
  TAG_CANDIDATE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_CANDIDATE_RE.exec(value)) !== null) {
    if (isActualHtmlTag(value, match[0], match[1], match.index)) return true;
  }
  return false;
};

const markdownText = z.string().max(12_000).pipe(
  z.string().refine((value) => !containsHtmlTags(value), {
    error: 'Markdown must not contain HTML tags',
  }),
);

const cvLinkSchema = z.object({
  label: shortText,
  url: httpUrl,
});

const cvContentSchema = z.object({
  contact: z.object({
    name: shortText,
    headline: shortText.optional(),
    email: shortText.optional(),
    phone: shortText.optional(),
    location: shortText.optional(),
    links: z.array(cvLinkSchema).max(30),
  }),
  skills: z.array(
    z.object({
      label: shortText,
      value: z.string().max(5000).optional(),
      group: shortText.optional(),
    }),
  ).max(150),
  education: z.array(
    z.object({
      institution: shortText,
      degree: shortText.optional(),
      field: shortText.optional(),
      location: shortText.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().max(5000).optional(),
    }),
  ).max(50),
  projects: z.array(
    z.object({
      title: shortText,
      role: shortText.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      links: z.array(cvLinkSchema).max(30),
      descriptionMarkdown: markdownText.optional(),
    }),
  ).max(50),
});

const cvUpdateSchema = z
  .object({
    content: cvContentSchema.optional(),
    templateKey: z.enum(cvTemplateKeys).optional(),
  })
  .refine((payload) => payload.content !== undefined || payload.templateKey !== undefined, {
    error: 'content or templateKey is required',
  });

export type CvContent = z.infer<typeof cvContentSchema>;

export const validateCvContent = (content: unknown) => cvContentSchema.parse(content);

export const validateCvUpdate = (payload: unknown) => cvUpdateSchema.parse(payload);

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Invalid date' });

export interface DateRange {
  startDate?: string | null;
  endDate?: string | null;
}

export const isValidDateRange = (data: DateRange) => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
};

const optionalEmail = z.union([z.email().max(254), z.literal(''), z.null()]).optional();
const optionalUrl = z.union([httpUrl, z.literal(''), z.null()]).optional();

export const profileUpdateSchema = z.object({
  headline: shortText.nullable().optional(),
  publicEmail: optionalEmail,
  phone: shortText.nullable().optional(),
  location: shortText.nullable().optional(),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

const educationBaseFields = {
  degree: shortText.nullable().optional(),
  field: shortText.nullable().optional(),
  location: shortText.nullable().optional(),
  startDate: dateOnly.nullable().optional(),
  endDate: dateOnly.nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  displayOrder: z.int().nullable().optional(),
};

export const educationCreateSchema = z
  .object({
    institution: z.string().min(1).max(255),
    ...educationBaseFields,
  })
  .refine(isValidDateRange, { error: 'Invalid date range' });

export const educationUpdateSchema = z
  .object({
    institution: z.string().min(1).max(255).optional(),
    ...educationBaseFields,
  })
  .refine(isValidDateRange, { error: 'Invalid date range' });

const projectFields = {
  title: z.string().min(1).max(255).optional(),
  role: shortText.nullable().optional(),
  startDate: dateOnly.nullable().optional(),
  endDate: dateOnly.nullable().optional(),
  links: z.array(cvLinkSchema).max(30).nullable().optional(),
  displayOrder: z.int().nullable().optional(),
  descriptionMarkdown: markdownText.nullable().optional(),
};

export const projectCreateSchema = z
  .object({
    ...projectFields,
    title: z.string().min(1).max(255),
  })
  .refine(isValidDateRange, { error: 'Invalid date range' });

export const projectUpdateSchema = z
  .object(projectFields)
  .refine(isValidDateRange, { error: 'Invalid date range' });

export const validateProfileUpdate = (payload: unknown) => profileUpdateSchema.parse(payload);
export const validateEducationCreate = (payload: unknown) => educationCreateSchema.parse(payload);
export const validateEducationUpdate = (payload: unknown) => educationUpdateSchema.parse(payload);
export const validateProjectCreate = (payload: unknown) => projectCreateSchema.parse(payload);
export const validateProjectUpdate = (payload: unknown) => projectUpdateSchema.parse(payload);

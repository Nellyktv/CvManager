import { z } from 'zod';

export const cvTemplateKeys = ['editorial-sidebar', 'structured-minimal'];

const httpUrl = z.httpUrl();

/** Known HTML elements only — TypeScript generics like Array<T> / List<a> must pass. */
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

const isIdentifierChar = (ch) => /[A-Za-z0-9_$]/.test(ch);

/** True for real HTML tags; false for generic type args like List<a> / Foo<p>. */
const isActualHtmlTag = (value, full, name, index) => {
  if (!HTML_TAG_NAMES.has(name.toLowerCase())) return false;
  if (full.startsWith('</')) return true;
  const afterName = full.slice(full.toLowerCase().indexOf(name.toLowerCase()) + name.length, -1);
  if (/[^\s/]/.test(afterName) || afterName.includes('/')) return true;
  if (index === 0) return true;
  return !isIdentifierChar(value[index - 1]);
};

export const containsHtmlTags = (value) => {
  TAG_CANDIDATE_RE.lastIndex = 0;
  let match;
  while ((match = TAG_CANDIDATE_RE.exec(value)) !== null) {
    if (isActualHtmlTag(value, match[0], match[1], match.index)) return true;
  }
  return false;
};

const markdownText = z.string().refine((value) => !containsHtmlTags(value), {
  error: 'Markdown must not contain HTML tags',
});

const cvLinkSchema = z.object({
  label: z.string(),
  url: httpUrl,
});

const cvContentSchema = z.object({
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

const cvUpdateSchema = z
  .object({
    content: cvContentSchema.optional(),
    templateKey: z.enum(cvTemplateKeys).optional(),
  })
  .refine((payload) => payload.content !== undefined || payload.templateKey !== undefined, {
    error: 'content or templateKey is required',
  });

export const validateCvContent = (content) => cvContentSchema.parse(content);

export const validateCvUpdate = (payload) => cvUpdateSchema.parse(payload);

export const sanitizeLegacyMarkdown = (value) => {
  if (value == null) return '';
  const text = String(value);
  return text.replace(TAG_CANDIDATE_RE, (full, name, offset) =>
    isActualHtmlTag(text, full, name, offset) ? '' : full,
  );
};

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Invalid date' });

export const isValidDateRange = (data) => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
};

const optionalEmail = z.union([z.email(), z.literal(''), z.null()]).optional();
const optionalUrl = z.union([httpUrl, z.literal(''), z.null()]).optional();

export const profileUpdateSchema = z.object({
  headline: z.string().nullable().optional(),
  publicEmail: optionalEmail,
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

const educationBaseFields = {
  degree: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startDate: dateOnly.nullable().optional(),
  endDate: dateOnly.nullable().optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.int().nullable().optional(),
};

export const educationCreateSchema = z
  .object({
    institution: z.string().min(1),
    ...educationBaseFields,
  })
  .refine(isValidDateRange, { error: 'Invalid date range' });

export const educationUpdateSchema = z
  .object({
    institution: z.string().min(1).optional(),
    ...educationBaseFields,
  })
  .refine(isValidDateRange, { error: 'Invalid date range' });

const projectFields = {
  title: z.string().min(1).optional(),
  role: z.string().nullable().optional(),
  startDate: dateOnly.nullable().optional(),
  endDate: dateOnly.nullable().optional(),
  links: z.array(cvLinkSchema).nullable().optional(),
  displayOrder: z.int().nullable().optional(),
  descriptionMarkdown: markdownText.nullable().optional(),
  description: markdownText.nullable().optional(),
};

export const projectCreateSchema = z
  .object({
    ...projectFields,
    title: z.string().min(1),
  })
  .refine(isValidDateRange, { error: 'Invalid date range' });

export const projectUpdateSchema = z
  .object(projectFields)
  .refine(isValidDateRange, { error: 'Invalid date range' });

export const validateProfileUpdate = (payload) => profileUpdateSchema.parse(payload);
export const validateEducationCreate = (payload) => educationCreateSchema.parse(payload);
export const validateEducationUpdate = (payload) => educationUpdateSchema.parse(payload);
export const validateProjectCreate = (payload) => projectCreateSchema.parse(payload);
export const validateProjectUpdate = (payload) => projectUpdateSchema.parse(payload);

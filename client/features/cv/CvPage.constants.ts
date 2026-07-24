import type { CvContent, CvTemplateKey } from '../../shared/types/cv';

export type CvWorkspaceTab = 'editor' | 'preview';

export type CvEditorSection = 'contact' | 'skills' | 'education' | 'projects';

export const CV_EDITOR_SECTIONS: CvEditorSection[] = [
  'contact',
  'skills',
  'education',
  'projects',
];

export const emptyCvContent = (): CvContent => ({
  contact: {
    name: '',
    links: [],
  },
  skills: [],
  education: [],
  projects: [],
});

export const DEFAULT_TEMPLATE_KEY: CvTemplateKey = 'editorial-sidebar';

export const CV_TEMPLATE_OPTIONS: Array<{
  key: CvTemplateKey;
  labelKey: 'cv.templateEditorialSidebar' | 'cv.templateStructuredMinimal';
}> = [
  { key: 'editorial-sidebar', labelKey: 'cv.templateEditorialSidebar' },
  { key: 'structured-minimal', labelKey: 'cv.templateStructuredMinimal' },
];

export const templateLabelKey = (
  templateKey: CvTemplateKey | string | null | undefined,
): (typeof CV_TEMPLATE_OPTIONS)[number]['labelKey'] => {
  const match = CV_TEMPLATE_OPTIONS.find((option) => option.key === templateKey);
  return match?.labelKey ?? 'cv.templateEditorialSidebar';
};

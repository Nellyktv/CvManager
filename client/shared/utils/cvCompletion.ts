import type { CvContent } from '../types/cv';

const hasNonblankInstitution = (content: CvContent) =>
  content.education.some((entry) => Boolean(entry.institution.trim()));

export const isCvComplete = (content: CvContent) =>
  Boolean(
    content.contact.name.trim() &&
      content.contact.email?.trim() &&
      hasNonblankInstitution(content),
  );

import type { CvLink } from './cv';

export type CandidateProfile = {
  headline?: string;
  publicEmail?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
};

export type Education = {
  institution: string;
  degree?: string;
  field?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  displayOrder?: number;
};

export type Project = {
  title: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  links: CvLink[];
  descriptionMarkdown?: string;
  description?: string;
  displayOrder?: number;
};

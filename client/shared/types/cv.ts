export type CvTemplateKey = 'editorial-sidebar' | 'structured-minimal';

export type CvLink = {
  label: string;
  url: string;
};

export type CvSkill = {
  label: string;
  value?: string;
  group?: string;
};

export type CvEducation = {
  institution: string;
  degree?: string;
  field?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type CvProject = {
  title: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  links: CvLink[];
  descriptionMarkdown?: string;
};

export type CvContent = {
  contact: {
    name: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    links: CvLink[];
  };
  skills: CvSkill[];
  education: CvEducation[];
  projects: CvProject[];
};

export type CvSectionKey = 'contact' | 'skills' | 'education' | 'projects';

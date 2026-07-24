import type { UserRole } from '../../store/UserStore';
import type { AttributeType } from '../attributes/AttributesPage.constants';
import type { CvLink } from '../../shared/types/cv';

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole | '';
};

export type CvPosition = {
  id: number;
  title: string;
};

export type Cv = {
  id: number;
  version: number;
  status: string;
  position: CvPosition | null;
};

export type AttributeItem = {
  id: number;
  name: string;
  type: AttributeType;
};

export type Skill = {
  attributeId: number;
  value: string;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  role?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  links?: CvLink[] | null;
  descriptionMarkdown?: string | null;
  displayOrder?: number | null;
};

export type ProjectFormValues = {
  title: string;
  role: string;
  startDate: string;
  endDate: string;
  links: CvLink[];
  descriptionMarkdown: string;
  displayOrder: string;
};

export type EducationFormValues = {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  displayOrder: string;
};

export const initialProjectForm: ProjectFormValues = {
  title: '',
  role: '',
  startDate: '',
  endDate: '',
  links: [],
  descriptionMarkdown: '',
  displayOrder: '',
};

export const initialEducationForm: EducationFormValues = {
  institution: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
  displayOrder: '',
};

export const emptyProfile: Profile = {
  firstName: '',
  lastName: '',
  email: '',
  role: '',
};

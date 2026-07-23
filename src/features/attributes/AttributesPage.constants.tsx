export type Attribute = {
  id: number;
  category: AttributeCategory;
  name: string;
  type: AttributeType;
  description: string;
};

export const initialForm = {
  name: '',
  description: '',
  category: '',
  type: '',
};

export type AttributeType = 'Boolean' | 'Numeric' | 'Text' | 'Date' | 'Dropdown';

export const typeOptions: AttributeType[] = ['Boolean', 'Numeric', 'Text', 'Date', 'Dropdown'];

export type AttributeCategory =
  | 'Certification'
  | 'DomainKnowledge'
  | 'PersonalInformation'
  | 'SoftSkills';

export const categoryOptions: AttributeCategory[] = [
  'Certification',
  'DomainKnowledge',
  'PersonalInformation',
  'SoftSkills',
];

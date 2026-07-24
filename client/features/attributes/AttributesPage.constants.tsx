export type Attribute = {
  id: number;
  name: string;
  type: AttributeType;
  description: string;
  options: string | null;
};

export type AttributeFormValues = {
  name: string;
  description: string;
  type: string;
  options: string;
};

export const initialForm: AttributeFormValues = {
  name: '',
  description: '',
  type: '',
  options: '',
};

export type AttributeType = 'Boolean' | 'Numeric' | 'Text' | 'Date' | 'Dropdown';

export const typeOptions: AttributeType[] = ['Boolean', 'Numeric', 'Text', 'Date', 'Dropdown'];

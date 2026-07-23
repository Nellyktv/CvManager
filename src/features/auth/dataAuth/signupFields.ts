export type FieldConfig = {
  name: 'name' | 'surName' | 'email' | 'password' | 'confirmPassword';
  labelKey: string;
  type: 'text' | 'email' | 'password';
  autoComplete: string;
  isPassword?: boolean;
};

export const fieldsRegistration: FieldConfig[] = [
  { name: 'name', labelKey: 'auth.firstName', type: 'text', autoComplete: 'given-name' },
  { name: 'surName', labelKey: 'auth.lastName', type: 'text', autoComplete: 'family-name' },
  { name: 'email', labelKey: 'auth.email', type: 'email', autoComplete: 'email' },
  {
    name: 'password',
    labelKey: 'auth.password',
    type: 'password',
    autoComplete: 'new-password',
    isPassword: true,
  },
  {
    name: 'confirmPassword',
    labelKey: 'auth.confirmPassword',
    type: 'password',
    autoComplete: 'new-password',
    isPassword: true,
  },
];

export const signInData = fieldsRegistration.filter(
  (el) => el.name === 'email' || el.name === 'password',
);

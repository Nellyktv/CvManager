import { z } from 'zod';

export type SignupFormMessages = {
  nameRequired: string;
  surNameRequired: string;
  invalidEmail: string;
  passwordMinLength: string;
  passwordNeedsUppercase: string;
  passwordNeedsNumber: string;
  confirmPasswordRequired: string;
  passwordsDontMatch: string;
};

export const createSignupSchema = (messages: SignupFormMessages) =>
  z
    .object({
      name: z.string().min(1, { error: messages.nameRequired }),
      surName: z.string().min(1, { error: messages.surNameRequired }),
      email: z.email(messages.invalidEmail),
      password: z
        .string()
        .min(8, messages.passwordMinLength)
        .regex(/[A-Z]/, messages.passwordNeedsUppercase)
        .regex(/[0-9]/, messages.passwordNeedsNumber),
      confirmPassword: z.string().min(1, { error: messages.confirmPasswordRequired }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: messages.passwordsDontMatch,
    });

export type SignupFormFields = {
  name: string;
  surName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginFormMessages = {
  invalidEmail: string;
  passwordMinLength: string;
  passwordNeedsUppercase: string;
  passwordNeedsNumber: string;
};

export const createLoginSchema = (messages: LoginFormMessages) =>
  z.object({
    email: z.email(messages.invalidEmail),
    password: z
      .string()
      .min(8, messages.passwordMinLength)
      .regex(/[A-Z]/, messages.passwordNeedsUppercase)
      .regex(/[0-9]/, messages.passwordNeedsNumber),
  });

export type LoginFormFields = {
  email: string;
  password: string;
};

export type ChangePasswordMessages = {
  passwordRequired: string;
  passwordsDontMatch: string;
};

export const createChangePasswordSchema = (messages: ChangePasswordMessages) =>
  z
    .object({
      newPassword: z.string().min(1, { error: messages.passwordRequired }),
      confirmPassword: z.string().min(1, { error: messages.passwordRequired }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      path: ['confirmPassword'],
      message: messages.passwordsDontMatch,
    });

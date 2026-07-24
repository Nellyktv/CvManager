import { z } from 'zod';

export const PasswordSchema = z.string().min(8, "Минимум 8 символов")
  .regex(/[A-Z]/, "Минимум 1 заглавная буква").regex(/[0-9]/, "Минимум 1 цифра");

export const confirmPasswordSchema = z.string().min(1, { error: "Пароль не может быть пустым" });

export const emailSchema = z.email("Введите правильный email");

export const FormSchema = z
  .object({
    name: z.string().min(1,{error:'Пожалуйста,введите ваше имя'}),
    surName: z.string().min(1,{error:'Пожалуйста,введите вашу фамилию'}),
    email: emailSchema,
    password: PasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

export type SignupFormFields = z.infer<typeof FormSchema>;

export const FormSchemaLogin = z.object({
  email: emailSchema,
  password: PasswordSchema,
});

export type LoginFormFields = z.infer<typeof FormSchemaLogin>;

export const ChangePasswordSchema = z
  .object({
    newPassword: confirmPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  });

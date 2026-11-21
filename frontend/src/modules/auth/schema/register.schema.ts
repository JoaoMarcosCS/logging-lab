import { z } from 'zod';

export const NameSchema = z
  .string()
  .trim()
  .min(3, 'Nome deve ter no mínimo 3 caracteres')
  .max(255, 'Nome deve ter no máximo 255 caracteres');

export const EmailSchema = z
  .email('E-mail inválido')
  .max(255, 'E-mail deve ter no máximo 255 caracteres');

export const PasswordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(72, 'Senha deve ter no máximo 72 caracteres')
  .refine((value) => /[A-Z]/.test(value), 'Senha deve conter ao menos uma letra maiúscula')
  .refine((value) => /[a-z]/.test(value), 'Senha deve conter ao menos uma letra minúscula')
  .refine((value) => /[0-9]/.test(value), 'Senha deve conter ao menos um número')
  .refine((value) => /[^A-Za-z0-9]/.test(value), 'Senha deve conter ao menos um símbolo');

export const PASSWORD_HINT = 'De 8 a 72 caracteres, com maiúscula, minúscula, número e símbolo.';

export const RegisterSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
});

export type RegisterData = z.infer<typeof RegisterSchema>;

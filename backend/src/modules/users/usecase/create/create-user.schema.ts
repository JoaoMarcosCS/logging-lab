import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  email: z
    .email('E-mail inválido')
    .max(255, 'E-mail deve ter no máximo 255 caracteres')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres')
    .refine(
      (value) => /[A-Z]/.test(value),
      'Senha deve conter ao menos uma letra maiúscula',
    )
    .refine(
      (value) => /[a-z]/.test(value),
      'Senha deve conter ao menos uma letra minúscula',
    )
    .refine(
      (value) => /[0-9]/.test(value),
      'Senha deve conter ao menos um número',
    )
    .refine(
      (value) => /[^A-Za-z0-9]/.test(value),
      'Senha deve conter ao menos um símbolo',
    ),
});

export type CreateUserData = z.infer<typeof CreateUserSchema>;

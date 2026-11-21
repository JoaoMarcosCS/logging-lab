import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email('E-mail inválido').max(255, 'E-mail deve ter no máximo 255 caracteres'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .max(72, 'Senha deve ter no máximo 72 caracteres'),
});

export type LoginData = z.infer<typeof LoginSchema>;

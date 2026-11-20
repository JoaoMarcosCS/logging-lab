import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email('E-mail inválido').max(255).toLowerCase(),
  password: z.string().min(1, 'Informe a senha').max(72),
});

export type LoginData = z.infer<typeof LoginSchema>;

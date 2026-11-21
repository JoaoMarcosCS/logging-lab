import { z } from 'zod';
import { PasswordSchema } from '@/modules/auth/schema/register.schema';

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: PasswordSchema,
    confirmPassword: z.string().min(1, 'Repita a nova senha'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

export type UpdatePasswordData = z.infer<typeof UpdatePasswordSchema>;

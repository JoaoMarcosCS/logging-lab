import { z } from 'zod';
import { CreateUserSchema } from '../create/create-user.schema.js';

export const UpdateUserPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: CreateUserSchema.shape.password,
});

export type UpdateUserPasswordData = z.infer<typeof UpdateUserPasswordSchema>;

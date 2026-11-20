import { z } from 'zod';
import { CreateUserSchema } from '../create/create-user.schema.js';

export const UpdateUserSchema = CreateUserSchema.pick({
  name: true,
  email: true,
})
  .partial()
  .refine(
    (data) => data.name !== undefined || data.email !== undefined,
    'Informe ao menos um campo para atualizar',
  );

export type UpdateUserData = z.infer<typeof UpdateUserSchema>;

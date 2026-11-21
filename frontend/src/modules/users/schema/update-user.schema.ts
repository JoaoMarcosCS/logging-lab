import { z } from 'zod';
import { EmailSchema, NameSchema } from '@/modules/auth/schema/register.schema';

export const UpdateUserSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
});

export type UpdateUserData = z.infer<typeof UpdateUserSchema>;

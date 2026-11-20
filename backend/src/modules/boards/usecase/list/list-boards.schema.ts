import { z } from 'zod';

export const ListBoardsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.uuid('Cursor inválido').optional(),
});

export type ListBoardsData = z.infer<typeof ListBoardsSchema>;

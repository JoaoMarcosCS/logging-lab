import { z } from 'zod';
import { CreateBoardSchema } from '../create/create-board.schema.js';

export const UpdateBoardSchema = CreateBoardSchema.partial().refine(
  (data) => data.title !== undefined || data.description !== undefined,
  'Informe ao menos um campo para atualizar',
);

export type UpdateBoardData = z.infer<typeof UpdateBoardSchema>;

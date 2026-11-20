import { z } from 'zod';

export const CreateBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullish(),
});

export type CreateBoardData = z.infer<typeof CreateBoardSchema>;

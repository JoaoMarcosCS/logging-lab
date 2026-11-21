import { z } from 'zod';

export const TASK_TITLE_MAX_LENGTH = 255;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export const SaveTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(TASK_TITLE_MAX_LENGTH, 'Título deve ter no máximo 255 caracteres'),
  description: z
    .string()
    .trim()
    .max(TASK_DESCRIPTION_MAX_LENGTH, 'Descrição deve ter no máximo 2000 caracteres'),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2)], { error: 'Prioridade inválida' }),
  workStatus: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)], {
    error: 'Status de trabalho inválido',
  }),
});

export type SaveTaskData = z.infer<typeof SaveTaskSchema>;

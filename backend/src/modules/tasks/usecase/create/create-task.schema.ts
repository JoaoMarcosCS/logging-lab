import { z } from 'zod';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título deve ter no máximo 255 caracteres'),
  description: z
    .string()
    .trim()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .nullish(),
  priority: z.enum(EPriorityTask, 'Prioridade inválida'),
});

export type CreateTaskData = z.infer<typeof CreateTaskSchema>;

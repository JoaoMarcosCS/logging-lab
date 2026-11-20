import { z } from 'zod';
import { EPriorityTask } from '../../../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../../../shared/enums/tasks/task-work-status.enum.js';

export const ListTasksSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.uuid('Cursor inválido').optional(),
  workStatus: z.coerce
    .number('Status de trabalho inválido')
    .pipe(z.enum(EWorkStatusTask, 'Status de trabalho inválido'))
    .optional(),
  priority: z.coerce
    .number('Prioridade inválida')
    .pipe(z.enum(EPriorityTask, 'Prioridade inválida'))
    .optional(),
});

export type ListTasksData = z.infer<typeof ListTasksSchema>;

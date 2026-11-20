import { z } from 'zod';
import { CreateTaskSchema } from '../create/create-task.schema.js';
import { EWorkStatusTask } from '../../../../shared/enums/tasks/task-work-status.enum.js';

export const UpdateTaskSchema = CreateTaskSchema.extend({
  workStatus: z.enum(EWorkStatusTask, 'Status de trabalho inválido'),
})
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    'Informe ao menos um campo para atualizar',
  );

export type UpdateTaskData = z.infer<typeof UpdateTaskSchema>;

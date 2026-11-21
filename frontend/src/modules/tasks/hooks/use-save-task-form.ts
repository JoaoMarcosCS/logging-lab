import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Priority, WorkStatus, type PublicTask } from '../interface/task.interface';
import { SaveTaskSchema, type SaveTaskData } from '../schema/save-task.schema';
import { createTaskRequest } from '../service/create-task.request';
import { updateTaskRequest, type UpdateTaskBody } from '../service/update-task.request';
import { useRefreshBoardTasks } from './use-refresh-board-tasks';
import { applyApiErrors } from '@/lib/api-error';

function getChanges(values: SaveTaskData, task: PublicTask): UpdateTaskBody {
  const changes: UpdateTaskBody = {};
  const description = values.description || null;
  if (values.title !== task.title) changes.title = values.title;
  if (description !== task.description) changes.description = description;
  if (values.priority !== task.priority) changes.priority = values.priority;
  if (values.workStatus !== task.workStatus) changes.workStatus = values.workStatus;
  return changes;
}

function toFormValues(task?: PublicTask): SaveTaskData {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? Priority.MEDIUM,
    workStatus: task?.workStatus ?? WorkStatus.AWAITING_START,
  };
}

interface UseSaveTaskFormOptions {
  boardId: string;
  task?: PublicTask;
  onSaved: () => void;
}

export function useSaveTaskForm({ boardId, task, onSaved }: UseSaveTaskFormOptions) {
  const { refreshTasks, handleNotFound } = useRefreshBoardTasks(boardId);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SaveTaskData>({
    resolver: zodResolver(SaveTaskSchema),
    defaultValues: toFormValues(task),
  });

  const mutation = useMutation({
    mutationFn: (values: SaveTaskData) => {
      if (!task) {
        return createTaskRequest(boardId, {
          title: values.title,
          description: values.description || null,
          priority: values.priority,
        });
      }
      return updateTaskRequest(boardId, task.id, getChanges(values, task));
    },
    onSuccess: () => {
      void refreshTasks();
      onSaved();
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    if (task && Object.keys(getChanges(values, task)).length === 0) {
      setFormError('Nenhuma alteração para salvar');
      return;
    }
    mutation.mutate(values, {
      onError: (error) => {
        handleNotFound(error);
        setFormError(
          applyApiErrors(error, form.setError, ['title', 'description', 'priority', 'workStatus']),
        );
      },
    });
  });

  return { form, onSubmit, isPending: mutation.isPending, formError };
}

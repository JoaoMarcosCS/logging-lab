import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { boardQueryKey, boardsQueryKey } from '../cache/boards-cache';
import type { PublicBoard } from '../interface/board.interface';
import { SaveBoardSchema, type SaveBoardData } from '../schema/save-board.schema';
import { createBoardRequest } from '../service/create-board.request';
import { updateBoardRequest, type UpdateBoardBody } from '../service/update-board.request';
import { applyApiErrors } from '@/lib/api-error';

function getChanges(values: SaveBoardData, board: PublicBoard): UpdateBoardBody {
  const changes: UpdateBoardBody = {};
  const description = values.description || null;
  if (values.title !== board.title) changes.title = values.title;
  if (description !== board.description) changes.description = description;
  return changes;
}

function saveBoard(values: SaveBoardData, board?: PublicBoard): Promise<PublicBoard> {
  if (!board) {
    return createBoardRequest({ title: values.title, description: values.description || null });
  }
  return updateBoardRequest(board.id, getChanges(values, board));
}

interface UseSaveBoardFormOptions {
  board?: PublicBoard;
  onSaved: (board: PublicBoard) => void;
}

export function useSaveBoardForm({ board, onSaved }: UseSaveBoardFormOptions) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SaveBoardData>({
    resolver: zodResolver(SaveBoardSchema),
    defaultValues: { title: board?.title ?? '', description: board?.description ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (values: SaveBoardData) => saveBoard(values, board),
    onSuccess: (saved) => {
      queryClient.setQueryData(boardQueryKey(saved.id), saved);
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey });
      onSaved(saved);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    if (board && Object.keys(getChanges(values, board)).length === 0) {
      setFormError('Nenhuma alteração para salvar');
      return;
    }
    mutation.mutate(values, {
      onError: (error) =>
        setFormError(applyApiErrors(error, form.setError, ['title', 'description'])),
    });
  });

  return { form, onSubmit, isPending: mutation.isPending, formError };
}

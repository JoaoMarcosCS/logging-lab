import { z } from 'zod';

export const BOARD_TITLE_MAX_LENGTH = 100;
export const BOARD_DESCRIPTION_MAX_LENGTH = 500;

export const SaveBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(BOARD_TITLE_MAX_LENGTH, 'Título deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .trim()
    .max(BOARD_DESCRIPTION_MAX_LENGTH, 'Descrição deve ter no máximo 500 caracteres'),
});

export type SaveBoardData = z.infer<typeof SaveBoardSchema>;

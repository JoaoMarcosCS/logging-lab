import { create } from 'zustand';
import type { Priority } from '../interface/task.interface';

interface TaskFiltersStore {
  priorityByBoard: Record<string, Priority | null>;
  setPriority: (boardId: string, priority: Priority | null) => void;
}

export const useTaskFiltersStore = create<TaskFiltersStore>()((set) => ({
  priorityByBoard: {},
  setPriority: (boardId, priority) =>
    set((state) => ({ priorityByBoard: { ...state.priorityByBoard, [boardId]: priority } })),
}));

export function usePriorityFilter(boardId: string): Priority | null {
  return useTaskFiltersStore((state) => state.priorityByBoard[boardId] ?? null);
}

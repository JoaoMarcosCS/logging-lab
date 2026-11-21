export const WorkStatus = {
  AWAITING_START: 0,
  IN_PROGRESS: 1,
  PAUSED: 2,
  CLOSED: 3,
} as const;

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus];

export const Priority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export interface PublicTask {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  priority: Priority;
  workStatus: WorkStatus;
  createdAt: string;
  updatedAt: string;
}

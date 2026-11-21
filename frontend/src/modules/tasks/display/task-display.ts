import { Priority, WorkStatus } from '../interface/task.interface';

export const WORK_STATUSES: WorkStatus[] = [
  WorkStatus.AWAITING_START,
  WorkStatus.IN_PROGRESS,
  WorkStatus.PAUSED,
  WorkStatus.CLOSED,
];

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  [WorkStatus.AWAITING_START]: 'Aguardando início',
  [WorkStatus.IN_PROGRESS]: 'Fazendo',
  [WorkStatus.PAUSED]: 'Pausada',
  [WorkStatus.CLOSED]: 'Encerrada',
};

export const WORK_STATUS_DOTS: Record<WorkStatus, string> = {
  [WorkStatus.AWAITING_START]: 'bg-fg-4',
  [WorkStatus.IN_PROGRESS]: 'bg-tiffany-glow shadow-[0_0_0_4px_rgb(79_230_217/0.2)]',
  [WorkStatus.PAUSED]: 'bg-tiffany-deep',
  [WorkStatus.CLOSED]: 'bg-ok',
};

export const PRIORITIES: Priority[] = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Baixa',
  [Priority.MEDIUM]: 'Média',
  [Priority.HIGH]: 'Alta',
};

export const PRIORITY_BADGES: Record<Priority, string> = {
  [Priority.LOW]: 'bg-fg/5 text-fg-2',
  [Priority.MEDIUM]: 'bg-tiffany-soft text-tiffany-deep',
  [Priority.HIGH]: 'bg-night text-white',
};

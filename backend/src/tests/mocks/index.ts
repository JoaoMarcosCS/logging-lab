import type { Mock } from 'vitest';
import type { ICacheProvider } from '../../infra/cache/cache-interface.provider.js';
import type { ISessionRepository } from '../../modules/sessions/repository/session-interface.repository.js';
import type { IUserRepository } from '../../modules/users/repository/user-interface.repository.js';
import type { IBoardRepository } from '../../modules/boards/repository/board-interface.repository.js';
import type { ITaskRepository } from '../../modules/tasks/repository/task-interface.repository.js';
import type { TokenService } from '../../modules/auth/token/token.service.js';
import type { PublicBoard } from '../../modules/boards/repository/board-interface.repository.js';
import type { PublicTask } from '../../modules/tasks/repository/task-interface.repository.js';
import { EPriorityTask } from '../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../shared/enums/tasks/task-work-status.enum.js';

export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? Mock<T[K]> : T[K];
};

export const mockCacheProvider = (): Mocked<ICacheProvider> => ({
  get: vi.fn().mockResolvedValue(null),
  getAndDelete: vi.fn().mockResolvedValue(null),
  set: vi.fn(),
  invalidate: vi.fn(),
  invalidateByPrefix: vi.fn(),
});

export const mockSessionRepository = (): Mocked<ISessionRepository> => ({
  save: vi.fn(),
  find: vi.fn(),
  revoke: vi.fn(),
  revokeAll: vi.fn(),
});

export const mockUserRepository = (): Mocked<IUserRepository> => ({
  create: vi.fn(),
  findBy: vi.fn(),
  findWithPasswordBy: vi.fn(),
  update: vi.fn(),
});

export const mockBoardRepository = (): Mocked<IBoardRepository> => ({
  create: vi.fn(),
  findActiveBy: vi.fn(),
  update: vi.fn(),
  deactivateWithTasks: vi.fn(),
});

export const mockTaskRepository = (): Mocked<ITaskRepository> => ({
  create: vi.fn(),
  findActiveBy: vi.fn(),
  update: vi.fn(),
  deactivate: vi.fn(),
});

export const USER_ID = '01970000-0000-7000-8000-000000000001';
export const OTHER_USER_ID = '01970000-0000-7000-8000-000000000002';
export const BOARD_ID = '01970000-0000-7000-8000-000000000010';
export const TASK_ID = '01970000-0000-7000-8000-000000000020';

export const makeBoard = (
  overrides: Partial<PublicBoard> = {},
): PublicBoard => ({
  id: BOARD_ID,
  userId: USER_ID,
  title: 'Estudos',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const makeTask = (overrides: Partial<PublicTask> = {}): PublicTask => ({
  id: TASK_ID,
  boardId: BOARD_ID,
  title: 'Ler sobre cache',
  description: null,
  priority: EPriorityTask.MEDIUM,
  workStatus: EWorkStatusTask.AWAITING_START,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export type MockedTokenService = {
  [K in keyof TokenService]: Mock<TokenService[K]>;
};

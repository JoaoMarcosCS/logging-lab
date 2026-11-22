import { fakerPT_BR as faker } from '@faker-js/faker';
import type {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  QueryDeepPartialEntity,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from '../data-source.js';
import { env } from '../../../shared/environment/env.js';
import { hash } from '../../../shared/utils/hash.js';
import { UserEntity } from '../../../modules/users/entity/user.entity.js';
import { BoardEntity } from '../../../modules/boards/entity/board.entity.js';
import { TaskEntity } from '../../../modules/tasks/entity/task.entity.js';
import { EStatusUser } from '../../../shared/enums/users/user-status.enum.js';
import { EPriorityTask } from '../../../shared/enums/tasks/task-priority.enum.js';
import { EWorkStatusTask } from '../../../shared/enums/tasks/task-work-status.enum.js';
import { loggerConfig } from '../../logger/logger.config.js';
import { pino } from 'pino';

const FAKER_SEED = 2026;
const BATCH_SIZE = 1000;
const HISTORY_DAYS = 365;
const USER_MIN_AGE_DAYS = 30;
const DAY_MS = 86_400_000;
const DELETED_RATIO = 0.1;

const MAIN_USER = {
  name: 'Usuário Teste',
  email: 'teste@gmail.com',
  password: '#Demo2026',
};

const MAIN_FIXED_BOARDS = [
  'Estudos',
  'Trabalho',
  'Casa',
  'Finanças',
  'Saúde',
  'Viagens',
  'Leituras',
  'Projetos pessoais',
  'Compras',
  'Academia',
];
const MAIN_FIXED_BOARD_TASKS = { min: 20, max: 50 };
const MAIN_LOAD_BOARD_TITLE = 'Board de carga';
const MAIN_LOAD_BOARD_TASKS = 5000;
const MAIN_TOTAL_BOARDS = 120;
const MAIN_DELETED_BOARDS = 5;
const MAIN_OTHER_BOARD_TASKS = { min: 0, max: 10 };

const EXTRA_USERS = 200;
const EXTRA_INACTIVE_USERS = 10;
const EXTRA_BOARDS = { min: 5, max: 15 };
const EXTRA_BOARD_TASKS = { min: 10, max: 100 };

const WORK_STATUS_WEIGHTS = [
  { weight: 30, value: EWorkStatusTask.AWAITING_START },
  { weight: 25, value: EWorkStatusTask.IN_PROGRESS },
  { weight: 10, value: EWorkStatusTask.PAUSED },
  { weight: 35, value: EWorkStatusTask.CLOSED },
];

const PRIORITY_WEIGHTS = [
  { weight: 40, value: EPriorityTask.LOW },
  { weight: 40, value: EPriorityTask.MEDIUM },
  { weight: 20, value: EPriorityTask.HIGH },
];

const TASK_VERBS = [
  'Revisar',
  'Comprar',
  'Organizar',
  'Pesquisar',
  'Planejar',
  'Finalizar',
  'Estudar',
  'Atualizar',
  'Agendar',
  'Separar',
  'Consertar',
  'Enviar',
];

type UserRow = UserEntity;
type BoardRow = Omit<BoardEntity, 'user'>;
type TaskRow = Omit<TaskEntity, 'board'>;

type SeedData = {
  users: UserRow[];
  boards: BoardRow[];
  tasks: TaskRow[];
};

type BoardPlan = {
  title: string;
  tasks: number;
  deleted: boolean;
};

const now = new Date();

// O seed roda fora do Nest, então usa o pino direto com a mesma configuração da API.
// child() cria um logger que acrescenta component: 'seed' em todas as linhas.
const logger = pino(loggerConfig).child({ component: 'seed' });

const daysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS);

const afterMs = (date: Date) => new Date(date.getTime() + 1);

const dateBetween = (from: Date, to: Date) =>
  from.getTime() >= to.getTime() ? from : faker.date.between({ from, to });

const description = () =>
  faker.datatype.boolean({ probability: 0.6 })
    ? faker.lorem.sentences({ min: 1, max: 3 })
    : null;

const buildUser = (
  name: string,
  email: string,
  password: string,
  inactive: boolean,
): UserRow => {
  const createdAt = dateBetween(
    daysAgo(HISTORY_DAYS),
    daysAgo(USER_MIN_AGE_DAYS),
  );
  const updatedAt = inactive
    ? dateBetween(afterMs(createdAt), now)
    : dateBetween(createdAt, now);

  return {
    id: uuidv7({ msecs: createdAt.getTime() }),
    name,
    email,
    password,
    status: inactive ? EStatusUser.INACTIVE : EStatusUser.ACTIVE,
    createdAt,
    updatedAt,
  };
};

const buildTasks = (board: BoardRow, count: number, until: Date): TaskRow[] => {
  const boardDeletedAt = board.isActive ? null : board.updatedAt;
  const limit = boardDeletedAt ?? until;

  return Array.from({ length: count }, () => {
    const createdAt = dateBetween(board.createdAt, limit);
    const workStatus = faker.helpers.weightedArrayElement(WORK_STATUS_WEIGHTS);
    const deleted =
      boardDeletedAt !== null ||
      faker.datatype.boolean({ probability: DELETED_RATIO });
    const mustChange = deleted || workStatus === EWorkStatusTask.CLOSED;

    const updatedAt =
      boardDeletedAt ??
      (mustChange
        ? dateBetween(afterMs(createdAt), limit)
        : dateBetween(createdAt, limit));

    return {
      id: uuidv7({ msecs: createdAt.getTime() }),
      boardId: board.id,
      title: `${faker.helpers.arrayElement(TASK_VERBS)} ${faker.commerce.productName().toLowerCase()}`,
      description: description(),
      priority: faker.helpers.weightedArrayElement(PRIORITY_WEIGHTS),
      workStatus,
      isActive: !deleted,
      createdAt,
      updatedAt,
    };
  });
};

const buildBoards = (
  user: UserRow,
  plans: BoardPlan[],
): Pick<SeedData, 'boards' | 'tasks'> => {
  const until = user.status === EStatusUser.INACTIVE ? user.updatedAt : now;
  const boards: BoardRow[] = [];
  const tasks: TaskRow[] = [];

  for (const plan of plans) {
    const createdAt = dateBetween(user.createdAt, until);
    const updatedAt = plan.deleted
      ? dateBetween(afterMs(createdAt), until)
      : dateBetween(createdAt, until);

    const board: BoardRow = {
      id: uuidv7({ msecs: createdAt.getTime() }),
      userId: user.id,
      title: plan.title,
      description: description(),
      isActive: !plan.deleted,
      createdAt,
      updatedAt,
    };

    boards.push(board);
    tasks.push(...buildTasks(board, plan.tasks, until));
  }

  return { boards, tasks };
};

const mainUserPlans = (): BoardPlan[] => {
  const fixed = MAIN_FIXED_BOARDS.map((title) => ({
    title,
    tasks: faker.number.int(MAIN_FIXED_BOARD_TASKS),
    deleted: false,
  }));

  const load = {
    title: MAIN_LOAD_BOARD_TITLE,
    tasks: MAIN_LOAD_BOARD_TASKS,
    deleted: false,
  };

  const others = Array.from(
    { length: MAIN_TOTAL_BOARDS - fixed.length - 1 },
    (_, index) => ({
      title: faker.commerce.department(),
      tasks: faker.number.int(MAIN_OTHER_BOARD_TASKS),
      deleted: index < MAIN_DELETED_BOARDS,
    }),
  );

  return [...fixed, load, ...others];
};

const extraUserPlans = (): BoardPlan[] =>
  Array.from({ length: faker.number.int(EXTRA_BOARDS) }, () => ({
    title: faker.commerce.department(),
    tasks: faker.number.int(EXTRA_BOARD_TASKS),
    deleted: faker.datatype.boolean({ probability: DELETED_RATIO }),
  }));

const buildSeed = async (): Promise<SeedData> => {
  const password = await hash.generate(MAIN_USER.password);
  const data: SeedData = { users: [], boards: [], tasks: [] };

  const mainUser = buildUser(MAIN_USER.name, MAIN_USER.email, password, false);
  const mainContent = buildBoards(mainUser, mainUserPlans());
  data.users.push(mainUser);
  data.boards.push(...mainContent.boards);
  data.tasks.push(...mainContent.tasks);

  const inactiveIndexes = new Set(
    faker.helpers.arrayElements(
      Array.from({ length: EXTRA_USERS }, (_, index) => index),
      EXTRA_INACTIVE_USERS,
    ),
  );

  for (let index = 0; index < EXTRA_USERS; index++) {
    const email = `user${String(index + 1).padStart(3, '0')}@taskflow.local`;
    const user = buildUser(
      faker.person.fullName(),
      email,
      password,
      inactiveIndexes.has(index),
    );
    const content = buildBoards(user, extraUserPlans());

    data.users.push(user);
    data.boards.push(...content.boards);
    data.tasks.push(...content.tasks);
  }

  return data;
};

const insertInBatches = async <T extends ObjectLiteral>(
  manager: EntityManager,
  entity: EntityTarget<T>,
  rows: QueryDeepPartialEntity<T>[],
) => {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    await manager
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(rows.slice(start, start + BATCH_SIZE))
      .updateEntity(false)
      .execute();
  }
};

const run = async () => {
  if (env.ENVIRONMENT === 'production') {
    throw new Error('O seed não pode rodar em produção');
  }

  await AppDataSource.initialize();

  try {
    const alreadySeeded = await AppDataSource.getRepository(
      UserEntity,
    ).existsBy({ email: MAIN_USER.email });

    if (alreadySeeded) {
      logger.info(
        { email: MAIN_USER.email },
        'seed skipped: main user already exists',
      );
      return;
    }

    faker.seed(FAKER_SEED);
    const data = await buildSeed();

    await AppDataSource.transaction(async (manager) => {
      await insertInBatches(manager, UserEntity, data.users);
      await insertInBatches(manager, BoardEntity, data.boards);
      await insertInBatches(manager, TaskEntity, data.tasks);
    });

    logger.info(
      {
        users: data.users.length,
        boards: data.boards.length,
        tasks: data.tasks.length,
      },
      'seed completed',
    );
  } finally {
    await AppDataSource.destroy();
  }
};

// exitCode em vez de process.exit(): deixa o pino esvaziar o buffer antes de o processo sair.
await run().catch((err: unknown) => {
  logger.fatal({ err }, 'seed failed');
  process.exitCode = 1;
});

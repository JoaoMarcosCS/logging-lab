import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { AppDataSource } from '../../infra/database/data-source.js';
import { loadEntities } from './load-entities.js';

beforeAll(async () => {
  AppDataSource.setOptions({
    url: inject('pgConnectionUri'),
    entities: await loadEntities(),
    migrations: [],
    synchronize: true,
  });

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

beforeEach(async () => {
  const tables = AppDataSource.entityMetadatas
    .map((metadata) => `"${metadata.tableName}"`)
    .join(', ');

  if (tables) {
    await AppDataSource.query(
      `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`,
    );
  }
});

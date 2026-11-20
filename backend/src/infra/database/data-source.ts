import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from '../../shared/environment/env.js';
import { join } from 'node:path';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  synchronize: false,
  logging: false,
  migrations: [join(import.meta.dirname, 'migrations/*.{js,ts}')],
  entities: [join(import.meta.dirname, '../../modules/**/*.entity.{js,ts}')],
  poolSize: 10,
  extra: {
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
  },
  connectTimeoutMS: 10000,
};

export const AppDataSource = new DataSource(dataSourceOptions);

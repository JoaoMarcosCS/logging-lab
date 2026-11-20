import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { UserEntity } from '../entity/user.entity.js';
import type { CreateUserData } from '../usecase/create/create-user.schema.js';
import { MessageError } from '../../../shared/enums/errors.enum.js';
import type {
  FindUserByParams,
  FindUserWithPasswordParams,
  IUserRepository,
  PublicUser,
  UpdateUserParams,
  UserWithPassword,
} from './user-interface.repository.js';
import { EStatusUser } from '../../../shared/enums/users/user-status.enum.js';

const PUBLIC_COLUMNS =
  'id, name, email, created_at AS "createdAt", updated_at AS "updatedAt"';

const UNIQUE_VIOLATION = '23505';

const UNIQUE_CONSTRAINT_ERRORS: Record<string, MessageError> = {
  UQ_users_email: MessageError.EMAIL_ALREADY_EXISTS,
};

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(data: CreateUserData): Promise<PublicUser> {
    try {
      const { raw } = await this.repository
        .createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values({ id: uuidv7(), ...data })
        .updateEntity(false)
        .returning(PUBLIC_COLUMNS)
        .execute();

      return raw[0];
    } catch (error) {
      throw this.toConflict(error) ?? error;
    }
  }

  async findBy(data: FindUserByParams): Promise<PublicUser[]> {
    const query = this.repository
      .createQueryBuilder('u')
      .select(PUBLIC_COLUMNS)
      .orderBy('u.id', 'DESC');

    if (!data.columns?.id && !data.columns?.email && !data.columns?.name) {
      throw new Error(
        'Nenhum critério de busca fornecido. É necessário fornecer pelo menos um critério de busca.',
      );
    }

    if (data.columns.id) {
      query.andWhere('u.id = :id', { id: data.columns.id });
    }

    if (data.columns.email) {
      query.andWhere('u.email = :email', { email: data.columns.email });
    }

    if (data.columns.name) {
      query.andWhere('u.name = :name', { name: data.columns.name });
    }

    if (data.columns.status?.length) {
      query.andWhere('u.status IN (:...status)', {
        status: data.columns.status,
      });
    } else {
      query.andWhere('u.status = :status', { status: EStatusUser.ACTIVE });
    }

    if (data.limit) {
      query.limit(data.limit);
    }

    if (data.cursor) {
      query.andWhere('u.id < :cursor', { cursor: data.cursor });
    }

    const users = await query.getRawMany<PublicUser>();

    return users;
  }

  async findWithPasswordBy(
    columns: FindUserWithPasswordParams,
  ): Promise<UserWithPassword | null> {
    if (!columns.id && !columns.email) {
      throw new Error(
        'Nenhum critério de busca fornecido. É necessário fornecer pelo menos um critério de busca.',
      );
    }

    const query = this.repository
      .createQueryBuilder('u')
      .select(['id', 'email', 'password', 'status'])
      .where('u.status = :status', { status: EStatusUser.ACTIVE });

    if (columns.id) {
      query.andWhere('u.id = :id', { id: columns.id });
    }

    if (columns.email) {
      query.andWhere('u.email = :email', { email: columns.email });
    }

    const user = await query.getRawOne<UserWithPassword>();

    return user ?? null;
  }

  async update(id: string, data: UpdateUserParams): Promise<PublicUser | null> {
    try {
      const { raw } = await this.repository
        .createQueryBuilder()
        .update(UserEntity)
        .set(data)
        .where('id = :id', { id })
        .updateEntity(false)
        .returning(PUBLIC_COLUMNS)
        .execute();

      return raw[0] ?? null;
    } catch (error) {
      throw this.toConflict(error) ?? error;
    }
  }

  private toConflict(error: unknown): ConflictException | undefined {
    if (!(error instanceof QueryFailedError)) {
      return undefined;
    }

    const { code, constraint } = error.driverError as {
      code?: string;
      constraint?: string;
    };
    const message =
      code === UNIQUE_VIOLATION && constraint
        ? UNIQUE_CONSTRAINT_ERRORS[constraint]
        : undefined;

    return message ? new ConflictException(message) : undefined;
  }
}

import type { UserEntity } from '../entity/user.entity.js';
import type { CreateUserData } from '../usecase/create/create-user.schema.js';
import type { EStatusUser } from '../../../shared/enums/users/user-status.enum.js';

export type PublicUser = Pick<
  UserEntity,
  'id' | 'name' | 'email' | 'createdAt' | 'updatedAt'
>;

export type UserWithPassword = Pick<
  UserEntity,
  'id' | 'email' | 'password' | 'status'
>;

export type FindUserByParams = {
  columns: Partial<Pick<UserEntity, 'id' | 'email' | 'name'>> & {
    status?: EStatusUser[];
  };
  limit?: number;
  cursor?: string;
};

export type FindUserWithPasswordParams = Partial<
  Pick<UserEntity, 'id' | 'email'>
>;

export type UpdateUserParams = Partial<
  Pick<UserEntity, 'name' | 'email' | 'password' | 'status'>
>;

export abstract class IUserRepository {
  abstract create(data: CreateUserData): Promise<PublicUser>;
  abstract findBy(data: FindUserByParams): Promise<PublicUser[]>;
  abstract findWithPasswordBy(
    columns: FindUserWithPasswordParams,
  ): Promise<UserWithPassword | null>;
  abstract update(
    id: string,
    data: UpdateUserParams,
  ): Promise<PublicUser | null>;
}

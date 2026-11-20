import { compare, hash as bcryptHash } from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hash = {
  async generate(data: string): Promise<string> {
    return bcryptHash(data, SALT_ROUNDS);
  },

  async compare(data: string, hashed: string): Promise<boolean> {
    return compare(data, hashed);
  },
};

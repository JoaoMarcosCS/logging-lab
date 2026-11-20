import { hash } from './hash.js';

describe('hash', () => {
  it('generates a bcrypt hash different from the input', async () => {
    const hashed = await hash.generate('Secret@123');

    expect(hashed).not.toBe('Secret@123');
    expect(hashed).toMatch(/^\$2[aby]\$10\$/);
  });

  it('generates different hashes for the same input', async () => {
    const [first, second] = await Promise.all([
      hash.generate('Secret@123'),
      hash.generate('Secret@123'),
    ]);

    expect(first).not.toBe(second);
  });

  it('compares a value against its hash', async () => {
    const hashed = await hash.generate('Secret@123');

    await expect(hash.compare('Secret@123', hashed)).resolves.toBe(true);
    await expect(hash.compare('wrong', hashed)).resolves.toBe(false);
  });
});

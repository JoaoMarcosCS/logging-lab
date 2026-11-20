export abstract class ICacheProvider {
  abstract get<T>(key: string): Promise<T | null>;
  abstract getAndDelete<T>(key: string): Promise<T | null>;
  abstract set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  abstract invalidate(key: string): Promise<void>;
  abstract invalidateByPrefix(prefix: string): Promise<void>;
}

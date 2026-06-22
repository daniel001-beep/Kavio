import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error("Failed to initialize Upstash Redis:", error);
  }
} else {
  console.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. Caching will be disabled.");
}

export const redis = redisClient;

/**
 * Helper to safely get cached data. If Redis is down or unconfigured, returns null.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (err) {
    console.warn(`Redis GET error for key ${key}:`, err);
    return null;
  }
}

/**
 * Helper to safely set cached data. If Redis is down or unconfigured, it safely ignores the operation.
 * @param ex Expiration in seconds (default: 60s)
 */
export async function setCached<T>(key: string, data: T, ex: number = 60): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, data, { ex });
  } catch (err) {
    console.warn(`Redis SET error for key ${key}:`, err);
  }
}

/**
 * Helper to safely delete cached data.
 */
export async function deleteCached(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`Redis DEL error for key ${key}:`, err);
  }
}

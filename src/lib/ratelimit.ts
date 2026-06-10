/**
 * Simple in-memory sliding window rate limiter.
 * 
 * NOTE: In a serverless environment (Next.js on Vercel), this state is local to the instance
 * and will reset on cold starts. For true multi-instance rate limiting, use Redis.
 */
class RateLimiter {
  private requests: Map<string, number[]>;
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.requests = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Checks if a request from the given key is allowed.
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    if (validTimestamps.length >= this.limit) {
      // Still update the map to purge expired timestamps
      this.requests.set(key, validTimestamps);
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  /**
   * Returns the remaining number of requests allowed in the current window.
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    return Math.max(0, this.limit - validTimestamps.length);
  }
}

// 5 transactions per 60 seconds per user/IP
export const transactionRateLimiter = new RateLimiter(5, 60000);

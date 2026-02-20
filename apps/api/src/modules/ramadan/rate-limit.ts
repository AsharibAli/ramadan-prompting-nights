import { TooManyRequestsError } from "@/pkg/errors";

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 20;

/**
 * In-memory sliding window rate limiter with automatic eviction.
 *
 * For multi-instance deployments, replace with Redis-backed solution
 * (e.g., @upstash/ratelimit). This works for single-instance deploys.
 */
const requestMap = new Map<string, number[]>();

// Periodic cleanup every 10 minutes to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [userId, timestamps] of requestMap) {
    const recent = timestamps.filter((ts) => now - ts < ONE_HOUR_MS);
    if (recent.length === 0) {
      requestMap.delete(userId);
    } else {
      requestMap.set(userId, recent);
    }
  }
}

export function enforceGenerationRateLimit(userId: string) {
  cleanupStaleEntries();

  const now = Date.now();
  const previous = requestMap.get(userId) ?? [];
  const recent = previous.filter((timestamp) => now - timestamp < ONE_HOUR_MS);

  if (recent.length >= MAX_REQUESTS_PER_HOUR) {
    const nextAllowedAt = new Date(recent[0]! + ONE_HOUR_MS);
    const hours = nextAllowedAt.getHours().toString().padStart(2, "0");
    const minutes = nextAllowedAt.getMinutes().toString().padStart(2, "0");
    throw new TooManyRequestsError(
      `You've used all your generations for this hour. Try again at ${hours}:${minutes}.`
    );
  }

  recent.push(now);
  requestMap.set(userId, recent);
}

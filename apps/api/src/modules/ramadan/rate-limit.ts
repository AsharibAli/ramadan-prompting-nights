import { TooManyRequestsError } from "@/pkg/errors";

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 20;
const requestMap = new Map<string, number[]>();

export function enforceGenerationRateLimit(userId: string) {
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

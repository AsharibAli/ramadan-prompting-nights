import {
  and,
  asc,
  challenges,
  db,
  desc,
  eq,
  submissions,
  users,
  type NewSubmission,
  sql,
} from "@repo/db";
import { estimateTokens } from "@repo/db";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/pkg/errors";
import { getPromptFormatHint, scorePromptQuality, validateStructuredPrompt } from "./prompt-rules";
import { getHighestSimilarity } from "./similarity";
import { validateGeneratedCodeAgainstTests } from "./validation";

type LeaderboardRow = {
  userId: string;
  name: string;
  imageUrl: string | null;
  totalScore: number;
  challengesSolved: number;
};

type SubmissionMeRow = {
  challengeId: number;
  dayNumber: number;
  title: string;
  prompt: string;
  generatedCode: string;
  promptTokens: number;
  codeTokens: number;
  totalTokens: number;
  promptQualityScore: number;
  similarityScore: number;
  weightedScore: number;
  createdAt: string;
  attemptCount: number;
};

type BreakdownRow = {
  challengeId: number;
  dayNumber: number;
  title: string;
  userId: string;
  name: string;
  totalScore: number;
  rank: number;
};

const SIMILARITY_BLOCK_THRESHOLD = 0.8;

const appEnv = (process.env.APP_ENV || "production").toLowerCase();
const isDevelopment = appEnv === "development";
const MIN_CORRECTNESS_TO_SUBMIT = 70;

const MAX_ATTEMPTS = 3;

// Multiplier applied to weighted_score based on which attempt number this is (1-based).
// Attempts beyond MAX_ATTEMPTS are blocked entirely.
const ATTEMPT_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 0.9,
  3: 0.75,
};

function getAttemptMultiplier(attemptNumber: number): number {
  return ATTEMPT_MULTIPLIERS[attemptNumber] ?? 0.5;
}
function isChallengeUnlocked(unlocksAt: Date) {
  // Local DX: unlock all days in development.
  if (isDevelopment) return true;
  return unlocksAt <= new Date();
}

/**
 * Compute efficiency score (0–100) from total token count using a continuous
 * piecewise-linear curve. Unlike the old bucket+penalty approach, the best
 * tier reaches a full 100 so a perfect weighted score of 100 is achievable.
 *
 * Token thresholds & efficiency mapping:
 *   ≤  80 tokens → 100  (concise, optimal prompt+code)
 *   ≤ 150 tokens →  80  (good)
 *   ≤ 250 tokens →  50  (acceptable)
 *   ≤ 400 tokens →  20  (verbose)
 *   >  400 tokens →   0  (excessively verbose)
 *
 * Between thresholds the score is linearly interpolated so there are no
 * cliff-edge jumps. For example 115 tokens → lerp(100, 80, (115-80)/(150-80)) = 90.
 */
function getEfficiencyScore(totalTokens: number): number {
  // Ordered breakpoints: [maxTokens, score]
  const BREAKPOINTS: [number, number][] = [
    [80, 100],
    [150, 80],
    [250, 50],
    [400, 20],
  ];

  // Best tier: full score
  if (totalTokens <= BREAKPOINTS[0]![0]) return BREAKPOINTS[0]![1];

  // Interpolate between adjacent breakpoints
  for (let i = 1; i < BREAKPOINTS.length; i++) {
    const [prevTokens, prevScore] = BREAKPOINTS[i - 1]!;
    const [currTokens, currScore] = BREAKPOINTS[i]!;
    if (totalTokens <= currTokens) {
      const t = (totalTokens - prevTokens) / (currTokens - prevTokens);
      return Math.round(prevScore + t * (currScore - prevScore));
    }
  }

  // Beyond last breakpoint: worst tier
  const last = BREAKPOINTS[BREAKPOINTS.length - 1]!;
  const [lastTokens, lastScore] = last;
  if (totalTokens <= lastTokens + 100) {
    // Gentle ramp from lastScore → 0 over the next 100 tokens
    const t = (totalTokens - lastTokens) / 100;
    return Math.round(lastScore * (1 - t));
  }
  return 0;
}

/**
 * Compute the final weighted score (0–100) from three normalized components:
 *
 *   Prompt Quality  (50%) — how well-structured and specific the prompt is
 *   Correctness     (30%) — server-side test pass rate
 *   Efficiency      (20%) — token economy (lower is better)
 *
 * Each input is on a 0–100 scale. The weighted sum is guaranteed to be in
 * [0, 100] with no clamping needed, and a perfect score of 100 is achievable
 * when all three components are 100.
 *
 * Math proof:
 *   max = (100/100)*50 + (100/100)*30 + (100/100)*20 = 50+30+20 = 100 ✓
 *   min = (0/100)*50   + (0/100)*30   + (0/100)*20   = 0          ✓
 */
function computeWeightedScore({
  totalTokens,
  promptQualityScore,
  correctnessScore,
}: {
  totalTokens: number;
  promptQualityScore: number;
  correctnessScore: number;
}) {
  const WEIGHT_QUALITY = 50;
  const WEIGHT_CORRECTNESS = 30;
  const WEIGHT_EFFICIENCY = 20;

  // Clamp inputs to [0, 100] for safety
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const efficiencyScore = getEfficiencyScore(totalTokens);

  const qualityPoints = (clamp(promptQualityScore) / 100) * WEIGHT_QUALITY;
  const correctnessPoints = (clamp(correctnessScore) / 100) * WEIGHT_CORRECTNESS;
  const efficiencyPoints = (clamp(efficiencyScore) / 100) * WEIGHT_EFFICIENCY;

  return Math.round(qualityPoints + correctnessPoints + efficiencyPoints);
}

// ─── In-Memory TTL Cache ─────────────────────────────────────────────
// Simple cache for expensive queries that don't need real-time freshness.

type CacheEntry<T> = { data: T; expiresAt: number };

function createTTLCache<T>(ttlMs: number) {
  let entry: CacheEntry<T> | null = null;
  return {
    get(): T | null {
      if (entry && Date.now() < entry.expiresAt) return entry.data;
      entry = null;
      return null;
    },
    set(data: T) {
      entry = { data, expiresAt: Date.now() + ttlMs };
    },
    invalidate() {
      entry = null;
    },
  };
}

const CACHE_TTL = 60_000; // 60 seconds
const challengesCache = createTTLCache<any[]>(CACHE_TTL);
const breakdownCache = createTTLCache<any[]>(CACHE_TTL);

// Keyed TTL cache for paginated leaderboard (one entry per page)
function createKeyedTTLCache<T>(ttlMs: number) {
  const entries = new Map<string, CacheEntry<T>>();
  return {
    get(key: string): T | null {
      const entry = entries.get(key);
      if (entry && Date.now() < entry.expiresAt) return entry.data;
      entries.delete(key);
      return null;
    },
    set(key: string, data: T) {
      entries.set(key, { data, expiresAt: Date.now() + ttlMs });
    },
    invalidate() {
      entries.clear();
    },
  };
}

const leaderboardCache = createKeyedTTLCache<{ entries: any[]; total: number; hasMore: boolean }>(CACHE_TTL);

interface RamadanService {
  getChallengesList: () => Promise<
    Array<{
      id: number;
      dayNumber: number;
      title: string;
      difficulty: "Easy" | "Medium" | "Hard";
      unlocksAt: Date;
      isUnlocked: boolean;
    }>
  >;
  getChallengeByDayNumber: (dayNumber: number) => Promise<typeof challenges.$inferSelect>;
  getLeaderboard: (page?: number, pageSize?: number) => Promise<{
    entries: Array<{
      rank: number;
      userId: string;
      name: string;
      imageUrl: string | null;
      totalScore: number;
      challengesSolved: number;
    }>;
    total: number;
    hasMore: boolean;
  }>;
  getLeaderboardBreakdown: () => Promise<
    Array<{
      challengeId: number;
      dayNumber: number;
      title: string;
      top: Array<{ userId: string; name: string; totalScore: number; rank: number }>;
    }>
  >;
  createSubmission: (params: {
    userId: string;
    challengeId: number;
    prompt: string;
    generatedCode: string;
  }) => Promise<{
    id: number;
    totalTokens: number;
    rawWeightedScore: number;
    weightedScore: number;
    correctnessScore: number;
    isNewBest: boolean;
    attemptNumber: number;
    multiplier: number;
  }>;
  getMyBestSubmissions: (userId: string) => Promise<SubmissionMeRow[]>;
  getMyRank: (userId: string) => Promise<{ rank: number; totalScore: number; challengesSolved: number } | null>;
  upsertUser: (params: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string | null;
  }) => Promise<void>;
}

export const ramadanService: RamadanService = {
  async getChallengesList() {
    // Return cached data if available (challenges are static once seeded)
    const cached = challengesCache.get();
    if (cached) return cached;

    const rows = await db
      .select({
        id: challenges.id,
        dayNumber: challenges.dayNumber,
        title: challenges.title,
        difficulty: challenges.difficulty,
        unlocksAt: challenges.unlocksAt,
      })
      .from(challenges)
      .orderBy(asc(challenges.dayNumber));

    const result = rows.map((row) => ({
      ...row,
      isUnlocked: isChallengeUnlocked(row.unlocksAt),
    }));

    challengesCache.set(result);
    return result;
  },

  async getChallengeByDayNumber(dayNumber: number) {
    if (dayNumber < 1 || dayNumber > 30) {
      throw new BadRequestError("dayNumber must be between 1 and 30");
    }

    const [row] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.dayNumber, dayNumber))
      .limit(1);
    if (!row) {
      throw new NotFoundError("Challenge not found");
    }

    if (!isChallengeUnlocked(row.unlocksAt)) {
      throw new ForbiddenError("This challenge hasn't unlocked yet");
    }

    return row;
  },

  async getLeaderboard(page = 1, pageSize = 100) {
    const limit = Math.min(Math.max(1, pageSize), 100);
    const offset = (Math.max(1, page) - 1) * limit;
    const cacheKey = `${page}:${limit}`;

    // Return cached leaderboard page (refreshed every 60s)
    const cached = leaderboardCache.get(cacheKey);
    if (cached) return cached;

    // Get total count of users with at least one passing submission
    const countResult = (await db.execute(sql`
      select count(distinct user_id) as count
      from submissions
      where passed = true
    `)) as unknown as [{ count: number }];
    const total = Number(countResult[0]?.count ?? 0);

    const rows = (await db.execute(sql<LeaderboardRow>`
      with best_per_user_challenge as (
        select distinct on (s.user_id, s.challenge_id)
          s.user_id,
          s.challenge_id,
          s.weighted_score as best_score,
          s.created_at     as first_submitted_at
        from submissions s
        where s.passed = true
        order by s.user_id, s.challenge_id, s.weighted_score desc, s.created_at asc
      )
      select
        u.id as "userId",
        u.name as "name",
        u.image_url as "imageUrl",
        coalesce(sum(best.best_score), 0) as "totalScore",
        count(best.challenge_id) as "challengesSolved",
        min(best.first_submitted_at) as "firstSubmittedAt"
      from best_per_user_challenge best
      join users u on u.id = best.user_id
      group by u.id, u.name, u.image_url
      order by "totalScore" desc, "firstSubmittedAt" asc
      limit ${limit}
      offset ${offset}
    `)) as LeaderboardRow[];

    const entries = rows.map((row, index) => ({
      rank: offset + index + 1,
      userId: String(row.userId),
      name: String(row.name),
      imageUrl: row.imageUrl ? String(row.imageUrl) : null,
      totalScore: Number(row.totalScore),
      challengesSolved: Number(row.challengesSolved),
    }));

    const result = { entries, total, hasMore: offset + entries.length < total };

    leaderboardCache.set(cacheKey, result);
    return result;
  },

  async getLeaderboardBreakdown() {
    const cached = breakdownCache.get();
    if (cached) return cached;

    const rows = (await db.execute(sql<BreakdownRow>`
      with best_per_user_challenge as (
        select distinct on (s.user_id, s.challenge_id)
          s.user_id,
          s.challenge_id,
          s.weighted_score as best_score,
          s.created_at     as first_submitted_at
        from submissions s
        where s.passed = true
        order by s.user_id, s.challenge_id, s.weighted_score desc, s.created_at asc
      ),
      ranked as (
        select
          c.id as "challengeId",
          c.day_number as "dayNumber",
          c.title as "title",
          u.id as "userId",
          u.name as "name",
          best.best_score as "totalScore",
          row_number() over (
            partition by c.id
            order by best.best_score desc, best.first_submitted_at asc
          ) as "rank"
        from best_per_user_challenge best
        join challenges c on c.id = best.challenge_id
        join users u on u.id = best.user_id
      )
      select *
      from ranked
      where "rank" <= 3
      order by "dayNumber" asc, "rank" asc
    `)) as BreakdownRow[];

    const grouped = new Map<
      number,
      {
        challengeId: number;
        dayNumber: number;
        title: string;
        top: Array<Omit<BreakdownRow, "challengeId" | "dayNumber" | "title">>;
      }
    >();

    for (const row of rows) {
      const challengeId = Number(row.challengeId);
      const dayNumber = Number(row.dayNumber);
      const title = String(row.title);
      const userId = String(row.userId);
      const name = String(row.name);

      if (!grouped.has(challengeId)) {
        grouped.set(challengeId, {
          challengeId,
          dayNumber,
          title,
          top: [],
        });
      }
      grouped.get(challengeId)!.top.push({
        userId,
        name,
        totalScore: Number(row.totalScore),
        rank: Number(row.rank),
      });
    }

    const result = Array.from(grouped.values());
    breakdownCache.set(result);
    return result;
  },

  async createSubmission({
    userId,
    challengeId,
    prompt,
    generatedCode,
  }: {
    userId: string;
    challengeId: number;
    prompt: string;
    generatedCode: string;
  }) {
    const promptValue = prompt.trim();
    const generatedCodeValue = generatedCode.trim();

    if (!promptValue) throw new BadRequestError("Prompt is required");
    if (!generatedCodeValue) throw new BadRequestError("Generated code is required");

    const structuredPrompt = validateStructuredPrompt(promptValue);
    if (!structuredPrompt.isValid) {
      throw new BadRequestError(
        `Prompt format invalid. Missing: ${structuredPrompt.missingSections.join(", ")}. ${getPromptFormatHint()}`
      );
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);
    if (!challenge) throw new NotFoundError("Challenge not found");
    if (!isChallengeUnlocked(challenge.unlocksAt)) {
      throw new ForbiddenError("This challenge hasn't unlocked yet");
    }

    // Reduced from 200 → 50 for performance (less DB transfer, faster Jaccard)
    const existingPrompts = await db
      .select({ prompt: submissions.prompt })
      .from(submissions)
      .where(and(eq(submissions.challengeId, challengeId), eq(submissions.passed, true)))
      .orderBy(desc(submissions.createdAt))
      .limit(50);

    const scenarioReferences = [
      challenge.title,
      challenge.description,
      challenge.exampleInput,
      challenge.exampleOutput,
      ...existingPrompts.map((row) => row.prompt),
    ];
    const similarityRatio = getHighestSimilarity(promptValue, scenarioReferences);
    if (similarityRatio >= SIMILARITY_BLOCK_THRESHOLD) {
      throw new BadRequestError(
        "Prompt is too similar to the scenario or existing submissions. Rewrite it in your own words."
      );
    }

    const similarityScore = Math.round(similarityRatio * 100);

    const serverValidation = validateGeneratedCodeAgainstTests({
      code: generatedCodeValue,
      functionName: challenge.functionName,
      testCases: challenge.testCases as Array<{ input: unknown; expected: unknown }>,
    });
    if (serverValidation.correctnessScore < MIN_CORRECTNESS_TO_SUBMIT) {
      const reason = serverValidation.reason ? ` ${serverValidation.reason}` : "";
      throw new BadRequestError(
        `Submission requires at least ${MIN_CORRECTNESS_TO_SUBMIT}% server test pass rate. Current: ${serverValidation.correctnessScore}%.${reason}`
      );
    }

    const promptTokens = estimateTokens(promptValue);
    const codeTokens = estimateTokens(generatedCodeValue);
    const totalTokens = promptTokens + codeTokens;
    const promptQualityScore = scorePromptQuality(promptValue);

    // Count existing PASSING submissions to determine attempt number.
    // Uses submissions_user_challenge_idx (userId, challengeId) — cheap index scan.
    const [passingCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.challengeId, challengeId),
          eq(submissions.passed, true)
        )
      );

    const existingPassingCount = passingCountRow?.count ?? 0;
    const attemptNumber = existingPassingCount + 1;

    if (existingPassingCount >= MAX_ATTEMPTS) {
      throw new BadRequestError(
        `You've used all ${MAX_ATTEMPTS} attempts for this challenge`
      );
    }

    // Compute raw score, then apply the diminishing multiplier for this attempt.
    const multiplier = getAttemptMultiplier(attemptNumber);
    const rawWeightedScore = computeWeightedScore({
      totalTokens,
      promptQualityScore,
      correctnessScore: serverValidation.correctnessScore,
    });
    const weightedScore = Math.round(rawWeightedScore * multiplier);

    // Check if this is a new personal best (compare against stored multiplied scores).
    const [best] = await db
      .select({ weightedScore: submissions.weightedScore })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.challengeId, challengeId),
          eq(submissions.passed, true)
        )
      )
      .orderBy(desc(submissions.weightedScore))
      .limit(1);

    const payload: NewSubmission = {
      userId,
      challengeId,
      prompt: promptValue,
      generatedCode: generatedCodeValue,
      promptTokens,
      codeTokens,
      totalTokens,
      promptQualityScore,
      similarityScore,
      rawWeightedScore,
      weightedScore,
      passed: true,
    };

    const [inserted] = await db.insert(submissions).values(payload).returning({ id: submissions.id });
    if (!inserted) throw new BadRequestError("Failed to save submission");

    // Invalidate leaderboard cache after new submission
    leaderboardCache.invalidate();
    breakdownCache.invalidate();

    const isNewBest = !best || weightedScore > best.weightedScore;
    return {
      id: inserted.id,
      totalTokens,
      rawWeightedScore,
      weightedScore,
      correctnessScore: serverValidation.correctnessScore,
      isNewBest,
      attemptNumber,
      multiplier,
    };
  },

  async getMyRank(userId: string) {
    const rows = (await db.execute(sql`
      with best_per_user_challenge as (
        select distinct on (s.user_id, s.challenge_id)
          s.user_id,
          s.challenge_id,
          s.weighted_score as best_score
        from submissions s
        where s.passed = true
        order by s.user_id, s.challenge_id, s.weighted_score desc, s.created_at asc
      ),
      ranked as (
        select
          user_id,
          sum(best_score) as total_score,
          count(challenge_id) as challenges_solved,
          row_number() over (order by sum(best_score) desc, min(best_score) desc) as rank
        from best_per_user_challenge
        group by user_id
      )
      select rank, total_score as "totalScore", challenges_solved as "challengesSolved"
      from ranked
      where user_id = ${userId}
    `)) as Array<{ rank: number; totalScore: number; challengesSolved: number }>;

    const row = rows[0];
    if (!row) return null;
    return {
      rank: Number(row.rank),
      totalScore: Number(row.totalScore),
      challengesSolved: Number(row.challengesSolved),
    };
  },

  async getMyBestSubmissions(userId: string) {
    const rows = (await db.execute(sql<SubmissionMeRow>`
      with best as (
        select distinct on (s.challenge_id)
          s.challenge_id,
          s.prompt,
          s.generated_code,
          s.prompt_tokens,
          s.code_tokens,
          s.total_tokens,
          s.prompt_quality_score,
          s.similarity_score,
          s.weighted_score,
          s.created_at
        from submissions s
        where s.user_id = ${userId} and s.passed = true
        order by s.challenge_id, s.weighted_score desc, s.created_at asc
      ),
      attempt_counts as (
        select challenge_id, count(*)::int as attempt_count
        from submissions
        where user_id = ${userId} and passed = true
        group by challenge_id
      )
      select
        best.challenge_id         as "challengeId",
        c.day_number              as "dayNumber",
        c.title                   as "title",
        best.prompt               as "prompt",
        best.generated_code       as "generatedCode",
        best.prompt_tokens        as "promptTokens",
        best.code_tokens          as "codeTokens",
        best.total_tokens         as "totalTokens",
        best.prompt_quality_score as "promptQualityScore",
        best.similarity_score     as "similarityScore",
        best.weighted_score       as "weightedScore",
        best.created_at           as "createdAt",
        coalesce(ac.attempt_count, 0) as "attemptCount"
      from best
      join challenges c on c.id = best.challenge_id
      left join attempt_counts ac on ac.challenge_id = best.challenge_id
    `)) as SubmissionMeRow[];

    return rows;
  },

  async upsertUser({
    id,
    name,
    email,
    imageUrl,
  }: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string | null;
  }) {
    await db
      .insert(users)
      .values({
        id,
        name,
        email,
        imageUrl: imageUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name,
          email,
          imageUrl: imageUrl ?? null,
        },
      });
  },
};

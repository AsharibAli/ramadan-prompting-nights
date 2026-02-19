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
function isChallengeUnlocked(unlocksAt: Date) {
  // Local DX: unlock all days in development.
  if (isDevelopment) return true;
  return unlocksAt <= new Date();
}

/**
 * Calculates efficiency penalty based on total token count (prompt + code).
 * Lower tokens = better efficiency = lower penalty.
 * Optimal submissions (≤90 tokens) receive no penalty, enabling 100/100 score.
 *
 * @param totalTokens - Combined prompt and code token count
 * @returns Penalty value (0-28) subtracted from efficiency score
 */
function getEfficiencyPenalty(totalTokens: number) {
  if (totalTokens <= 90) return 0;
  if (totalTokens <= 140) return 6;
  if (totalTokens <= 220) return 12;
  if (totalTokens <= 320) return 20;
  return 28;
}

function computeWeightedScore({
  totalTokens,
  promptQualityScore,
  correctnessScore,
}: {
  totalTokens: number;
  promptQualityScore: number;
  correctnessScore: number;
}) {
  const efficiencyPenalty = getEfficiencyPenalty(totalTokens);
  const efficiencyScore = Math.max(0, 100 - efficiencyPenalty * 2);
  const qualityPoints = (promptQualityScore / 100) * 60;
  const correctnessPoints = (correctnessScore / 100) * 20;
  const efficiencyPoints = (efficiencyScore / 100) * 20;
  return Math.round(Math.min(100, qualityPoints + correctnessPoints + efficiencyPoints));
}

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
  getChallengeByDayNumber: (dayNumber: number) => Promise<(typeof challenges.$inferSelect)>;
  getLeaderboard: () => Promise<
    Array<{
      rank: number;
      userId: string;
      name: string;
      imageUrl: string | null;
      totalScore: number;
      challengesSolved: number;
    }>
  >;
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
  }) => Promise<{ id: number; totalTokens: number; weightedScore: number; correctnessScore: number; isNewBest: boolean }>;
  getMyBestSubmissions: (userId: string) => Promise<SubmissionMeRow[]>;
  upsertUser: (params: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string | null;
  }) => Promise<void>;
}

export const ramadanService: RamadanService = {
  async getChallengesList() {
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

    return rows.map((row) => ({
      ...row,
      isUnlocked: isChallengeUnlocked(row.unlocksAt),
    }));
  },

  async getChallengeByDayNumber(dayNumber: number) {
    if (dayNumber < 1 || dayNumber > 30) {
      throw new BadRequestError("dayNumber must be between 1 and 30");
    }

    const [row] = await db.select().from(challenges).where(eq(challenges.dayNumber, dayNumber)).limit(1);
    if (!row) {
      throw new NotFoundError("Challenge not found");
    }

    if (!isChallengeUnlocked(row.unlocksAt)) {
      throw new ForbiddenError("This challenge hasn't unlocked yet");
    }

    return row;
  },

  async getLeaderboard() {
    const rows = (await db.execute(sql<LeaderboardRow>`
      with best_per_user_challenge as (
        select s.user_id, s.challenge_id, max(s.weighted_score) as best_score
        from submissions s
        where s.passed = true
        group by s.user_id, s.challenge_id
      )
      select
        u.id as "userId",
        u.name as "name",
        u.image_url as "imageUrl",
        coalesce(sum(best.best_score), 0) as "totalScore",
        count(best.challenge_id) as "challengesSolved"
      from best_per_user_challenge best
      join users u on u.id = best.user_id
      group by u.id, u.name, u.image_url
      order by "totalScore" desc
      limit 100
    `)) as LeaderboardRow[];

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: String(row.userId),
      name: String(row.name),
      imageUrl: row.imageUrl ? String(row.imageUrl) : null,
      totalScore: Number(row.totalScore),
      challengesSolved: Number(row.challengesSolved),
    }));
  },

  async getLeaderboardBreakdown() {
    const rows = (await db.execute(sql<BreakdownRow>`
      with best_per_user_challenge as (
        select s.user_id, s.challenge_id, max(s.weighted_score) as best_score
        from submissions s
        where s.passed = true
        group by s.user_id, s.challenge_id
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
            order by best.best_score desc
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

    const grouped = new Map<number, { challengeId: number; dayNumber: number; title: string; top: Array<Omit<BreakdownRow, "challengeId" | "dayNumber" | "title">> }>();

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

    return Array.from(grouped.values());
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

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
    if (!challenge) throw new NotFoundError("Challenge not found");
    if (!isChallengeUnlocked(challenge.unlocksAt)) {
      throw new ForbiddenError("This challenge hasn't unlocked yet");
    }

    const existingPrompts = await db
      .select({ prompt: submissions.prompt })
      .from(submissions)
      .where(and(eq(submissions.challengeId, challengeId), eq(submissions.passed, true)))
      .orderBy(desc(submissions.createdAt))
      .limit(200);

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
    const weightedScore = computeWeightedScore({
      totalTokens,
      promptQualityScore,
      correctnessScore: serverValidation.correctnessScore,
    });

    const [best] = await db
      .select({
        weightedScore: submissions.weightedScore,
      })
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
      weightedScore,
      passed: true,
    };

    const [inserted] = await db.insert(submissions).values(payload).returning({ id: submissions.id });
    if (!inserted) throw new BadRequestError("Failed to save submission");

    const isNewBest = !best || weightedScore > best.weightedScore;
    return {
      id: inserted.id,
      totalTokens,
      weightedScore,
      correctnessScore: serverValidation.correctnessScore,
      isNewBest,
    };
  },

  async getMyBestSubmissions(userId: string) {
    const rows = (await db.execute(sql<SubmissionMeRow>`
      select distinct on (s.challenge_id)
        s.challenge_id as "challengeId",
        c.day_number as "dayNumber",
        c.title as "title",
        s.prompt as "prompt",
        s.generated_code as "generatedCode",
        s.prompt_tokens as "promptTokens",
        s.code_tokens as "codeTokens",
        s.total_tokens as "totalTokens",
        s.prompt_quality_score as "promptQualityScore",
        s.similarity_score as "similarityScore",
        s.weighted_score as "weightedScore",
        s.created_at as "createdAt"
      from submissions s
      join challenges c on c.id = s.challenge_id
      where s.user_id = ${userId} and s.passed = true
      order by s.challenge_id, s.weighted_score desc, s.created_at asc
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

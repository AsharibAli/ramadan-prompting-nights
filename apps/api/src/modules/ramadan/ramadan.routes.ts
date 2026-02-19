import { zValidator } from "@hono/zod-validator";
import { estimateTokens } from "@repo/db";
import { logger } from "@repo/logs";
import { Hono } from "hono";
import { z } from "zod/v4";
import { AI_CONFIG } from "@/config/ai";
import { BadRequestError } from "@/pkg/errors";
import { auth, getUserId, requireAuth } from "@/pkg/middleware/clerk-auth";
import { ramadanService } from "./ramadan.service";
import { enforceGenerationRateLimit } from "./rate-limit";

const getChallengeParamsSchema = z.object({
  dayNumber: z.coerce.number().int().min(1).max(30),
});

const generateSchema = z.object({
  prompt: z.string().trim().min(1).max(2400),
  challengeDescription: z.string().trim().min(1),
  functionName: z.string().trim().min(1),
});

const submissionSchema = z.object({
  challengeId: z.number().int().positive(),
  prompt: z.string().trim().min(1).max(2400),
  generatedCode: z.string().trim().min(1),
});

export const ramadanRoutes = new Hono()
  .get("/challenges", async (c) => {
    const data = await ramadanService.getChallengesList();
    return c.json(data);
  })
  .get(
    "/challenges/:dayNumber",
    zValidator("param", getChallengeParamsSchema),
    async (c) => {
      const { dayNumber } = c.req.valid("param");
      const challenge = await ramadanService.getChallengeByDayNumber(dayNumber);
      return c.json(challenge);
    }
  )
  .get("/leaderboard", async (c) => {
    const leaderboard = await ramadanService.getLeaderboard();
    return c.json(leaderboard);
  })
  .get("/leaderboard/breakdown", async (c) => {
    const breakdown = await ramadanService.getLeaderboardBreakdown();
    return c.json(breakdown);
  })
  .use(auth(), requireAuth)
  .use(async (c, next) => {
    const userId = getUserId(c);

    try {
      const clerk = c.get("clerk");
      const clerkUser = await clerk.users.getUser(userId);

      const primaryEmail =
        clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        `${userId}@clerk.local`;

      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
        clerkUser.username ||
        "GIAIC Student";

      await ramadanService.upsertUser({
        id: userId,
        name,
        email: primaryEmail,
        imageUrl: clerkUser.imageUrl,
      });
    } catch (error) {
      logger.warn({ error, userId }, "Could not sync Clerk user details, using fallback profile");
      await ramadanService.upsertUser({
        id: userId,
        name: "GIAIC Student",
        email: `${userId}@clerk.local`,
        imageUrl: null,
      });
    }

    await next();
  })
  .post("/generate", zValidator("json", generateSchema), async (c) => {
    const userId = getUserId(c);
    enforceGenerationRateLimit(userId);

    const { prompt, challengeDescription, functionName } = c.req.valid("json");

    if (!process.env.OPENROUTER_API_KEY) {
      throw new BadRequestError("OPENROUTER_API_KEY is missing on server");
    }

    const response = await fetch(AI_CONFIG.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ramadan-prompting-nights.vercel.app",
        "X-Title": "Ramadan Prompting Nights",
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: "system", content: AI_CONFIG.systemPrompt },
          {
            role: "user",
            content: `Challenge: ${challengeDescription}\nRequired function name: ${functionName}\n\nApproach: ${prompt}`,
          },
        ],
        max_tokens: AI_CONFIG.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new BadRequestError("Failed to generate code. Please try again.");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    let code = data.choices?.[0]?.message?.content?.trim() ?? "";
    code = code.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();

    const promptTokens = estimateTokens(prompt);
    const codeTokens = estimateTokens(code);

    return c.json({
      code,
      promptTokens,
      codeTokens,
    });
  })
  .post("/submissions", zValidator("json", submissionSchema), async (c) => {
    const userId = getUserId(c);
    const payload = c.req.valid("json");
    const submission = await ramadanService.createSubmission({ userId, ...payload });
    return c.json(submission, 201);
  })
  .get("/submissions/me", async (c) => {
    const userId = getUserId(c);
    const submissions = await ramadanService.getMyBestSubmissions(userId);
    return c.json(submissions);
  });

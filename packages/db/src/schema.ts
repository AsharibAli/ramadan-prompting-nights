import { newId, newIdWithoutPrefix } from "@repo/id";
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { lifecycleDates } from "./util/lifecycle-dates";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex("users_email_unique_idx").on(table.email),
  })
);

export const challenges = pgTable(
  "challenges",
  {
    id: serial("id").primaryKey(),
    dayNumber: integer("day_number").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    functionName: text("function_name").notNull(),
    exampleInput: text("example_input").notNull(),
    exampleOutput: text("example_output").notNull(),
    testCases: jsonb("test_cases").notNull(),
    difficulty: text("difficulty").$type<"Easy" | "Medium" | "Hard">().notNull(),
    unlocksAt: timestamp("unlocks_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    dayNumberIdx: index("challenges_day_number_idx").on(table.dayNumber),
  })
);

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    generatedCode: text("generated_code").notNull(),
    promptTokens: integer("prompt_tokens").notNull(),
    codeTokens: integer("code_tokens").notNull(),
    totalTokens: integer("total_tokens").notNull(),
    promptQualityScore: integer("prompt_quality_score").notNull().default(0),
    similarityScore: integer("similarity_score").notNull().default(0),
    weightedScore: integer("weighted_score").notNull().default(0),
    passed: boolean("passed").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userChallengeIdx: index("submissions_user_challenge_idx").on(table.userId, table.challengeId),
  })
);

export const posts = pgTable("posts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  ...lifecycleDates,
}).enableRLS();

export const chats = pgTable("chats", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => newIdWithoutPrefix(10)),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull().default("Untitled"),
  ...lifecycleDates,
}).enableRLS();

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => newId("message")),
  chatId: varchar("chat_id", { length: 255 })
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  message: jsonb("message").notNull(),
  ...lifecycleDates,
}).enableRLS();

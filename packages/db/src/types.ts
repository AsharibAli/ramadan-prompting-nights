import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import * as schema from "./schema";

export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

export type Challenge = InferSelectModel<typeof schema.challenges>;
export type NewChallenge = InferInsertModel<typeof schema.challenges>;

export type Submission = InferSelectModel<typeof schema.submissions>;
export type NewSubmission = InferInsertModel<typeof schema.submissions>;

export type Post = InferSelectModel<typeof schema.posts>;
export type NewPost = InferInsertModel<typeof schema.posts>;

export type Chat = InferSelectModel<typeof schema.chats>;
export type NewChat = InferInsertModel<typeof schema.chats>;

export type ChatMessage = InferSelectModel<typeof schema.chatMessages>;
export type NewChatMessage = InferInsertModel<typeof schema.chatMessages>;

export const userInsertSchema = createInsertSchema(schema.users);
export const userSelectSchema = createSelectSchema(schema.users);

export const challengeInsertSchema = createInsertSchema(schema.challenges);
export const challengeSelectSchema = createSelectSchema(schema.challenges);

export const submissionInsertSchema = createInsertSchema(schema.submissions).omit({
  userId: true,
  promptTokens: true,
  codeTokens: true,
  totalTokens: true,
  promptQualityScore: true,
  similarityScore: true,
  weightedScore: true,
  passed: true,
});
export const submissionSelectSchema = createSelectSchema(schema.submissions);

export const chatInsertSchema = createInsertSchema(schema.chats).omit({ userId: true });
export const chatSelectSchema = createSelectSchema(schema.chats);

export const chatMessageInsertSchema = createInsertSchema(schema.chatMessages).omit({
  userId: true,
  chatId: true,
});
export const chatMessageSelectSchema = createSelectSchema(schema.chatMessages);

export const postInsertSchema = createInsertSchema(schema.posts).omit({ userId: true });
export const postSelectSchema = createSelectSchema(schema.posts);

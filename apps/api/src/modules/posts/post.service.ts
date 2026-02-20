import { db, type NewPost, posts } from "@repo/db";
import { desc } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const postService = {
  async createPost(post: NewPost) {
    const newPost = await db.insert(posts).values(post).returning();
    return newPost;
  },

  async getPosts(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const limit = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const offset = (Math.max(1, page) - 1) * limit;

    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return allPosts;
  },
};

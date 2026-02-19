import { Clerk } from "@clerk/clerk-js";

export const clerk = new Clerk(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "");

export async function getToken() {
  if (typeof document === "undefined") return null;

  await clerk.load();
  const token = await clerk.session?.getToken();
  return token;
}

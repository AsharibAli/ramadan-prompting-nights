/**
 * Client-side token retrieval using @clerk/nextjs (which is already loaded via ClerkProvider).
 *
 * Uses window.Clerk that ClerkProvider injects — no separate @clerk/clerk-js bundle needed.
 * This eliminates the ~240KB duplicate Clerk bundle that was loaded via direct @clerk/clerk-js import.
 */
export async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // ClerkProvider from @clerk/nextjs injects window.Clerk
  const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
  if (!clerk?.session) return null;

  try {
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

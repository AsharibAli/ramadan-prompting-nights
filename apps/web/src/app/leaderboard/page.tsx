"use client";

import { ChevronDown, Trophy } from "lucide-react";
import { useMemo } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLeaderboard } from "@/api/ramadan.api";

const PAGE_SIZE = 100;

export default function LeaderboardPage() {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetLeaderboard(PAGE_SIZE);

  // Flatten all pages into a single entries array
  const allEntries = useMemo(
    () => data?.pages.flatMap((page) => page.entries) ?? [],
    [data]
  );

  const total = data?.pages[0]?.total ?? 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton className="h-16 w-full bg-white/10" key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="px-4 py-8 text-[var(--error)]">Unable to load leaderboard right now.</p>;
  }

  const [first, second, third, ...rest] = allEntries;

  return (
    <div className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
      <MainHeader />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-[var(--text-primary)] md:text-4xl">Leaderboard</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] md:text-base">
            Ranked by highest weighted score across all scenario challenges
            {total > 0 && (
              <span className="ml-1 text-xs">({total} participants)</span>
            )}
          </p>
        </div>
        <Trophy className="size-7 shrink-0 text-[var(--accent-gold)] md:size-8" />
      </div>

      {/* Top 3 — horizontal scroll on very small screens, grid on sm+ */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[first, second, third].map((entry, idx) => (
          <Card className="glass-card" key={entry?.userId ?? idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">#{idx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="truncate font-semibold">{entry?.name ?? "—"}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {entry?.challengesSolved ?? 0} solved
              </p>
              <p className="mt-2 text-[var(--accent-gold)]">{entry?.totalScore ?? 0} pts</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="space-y-2 p-3 md:p-4">
          {rest.length === 0 ? (
            <p className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              No ranks beyond top 3 yet.
            </p>
          ) : (
            rest.map((entry) => (
              <div
                className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2"
                key={entry.userId}
              >
                <p className="w-10 shrink-0 font-mono text-sm">#{entry.rank}</p>
                <p className="min-w-0 flex-1 truncate">{entry.name}</p>
                <p className="hidden shrink-0 text-sm text-[var(--text-secondary)] sm:block">{entry.challengesSolved} solved</p>
                <Badge className="shrink-0 bg-[var(--accent-gold-dim)] text-[var(--accent-gold)]">
                  {entry.totalScore}
                </Badge>
              </div>
            ))
          )}

          {hasNextPage && (
            <div className="flex flex-col items-center gap-2 pt-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Showing {allEntries.length} of {total} participants
              </p>
              <Button
                className="gap-2"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                variant="outline"
              >
                {isFetchingNextPage ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4" />
                    Show next {Math.min(PAGE_SIZE, total - allEntries.length)}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

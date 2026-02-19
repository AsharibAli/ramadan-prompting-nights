"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { MainHeader } from "@/components/layout/main-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLeaderboard } from "@/api/ramadan.api";

export default function LeaderboardPage() {
  const { data, isLoading, isError } = useGetLeaderboard();

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

  const [first, second, third, ...rest] = data;

  return (
    <div className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-10">
      <MainHeader />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-[var(--text-primary)]">Leaderboard</h1>
          <p className="text-[var(--text-secondary)]">
            Ranked by highest weighted score across all scenario challenges
          </p>
        </div>
        <Trophy className="size-8 text-[var(--accent-gold)]" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[first, second, third].map((entry, idx) => (
          <Card className="glass-card" key={entry?.userId ?? idx}>
            <CardHeader>
              <CardTitle className="text-xl">#{idx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{entry?.name ?? "—"}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {entry?.challengesSolved ?? 0} solved
              </p>
              <p className="mt-2 text-[var(--accent-gold)]">{entry?.totalScore ?? 0} points</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="space-y-2 p-4">
          {rest.length === 0 ? (
            <p className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              No ranks beyond top 3 yet.
            </p>
          ) : (
            rest.map((entry) => (
              <div
                className="grid grid-cols-[60px_1fr_auto_auto] items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2"
                key={entry.userId}
              >
                <p className="font-mono text-sm">#{entry.rank}</p>
                <p>{entry.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{entry.challengesSolved} solved</p>
                <Badge className="bg-[var(--accent-gold-dim)] text-[var(--accent-gold)]">
                  {entry.totalScore}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-[var(--text-secondary)]">
        <Link className="hover:text-[var(--accent-gold)]" href="/">
          Back to landing
        </Link>
      </div>
    </div>
  );
}

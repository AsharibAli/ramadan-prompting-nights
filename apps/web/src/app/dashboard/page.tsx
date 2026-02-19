"use client";

import { Trophy } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetChallenges, useGetLeaderboard, useGetMySubmissions } from "@/api/ramadan.api";
import { getCountdownParts, toPktLabel } from "@/lib/ramadan-time";

export default function DashboardHomePage() {
  const { data: challenges = [] } = useGetChallenges();
  const { data: submissions = [] } = useGetMySubmissions();
  const { data: leaderboard = [] } = useGetLeaderboard();
  const { user } = useUser();

  const completed = submissions.length;
  const totalScore = submissions.reduce((sum, item) => sum + item.weightedScore, 0);
  const me = leaderboard.find((item) => item.userId === user?.id);
  const displayName = user?.fullName || user?.firstName || "Student";

  const nextChallenge = useMemo(() => {
    return challenges.find((challenge) => !challenge.isUnlocked);
  }, [challenges]);

  const countdown = nextChallenge ? getCountdownParts(nextChallenge.unlocksAt) : null;

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display text-3xl text-[var(--text-primary)]">
            Welcome {displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-sm text-[var(--text-secondary)]">Your Challenges Completed</p>
            <p className="mt-1 font-semibold text-2xl">{completed}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-sm text-[var(--text-secondary)]">Your Total Weighted Score</p>
            <p className="mt-1 font-semibold text-2xl">{totalScore}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-sm text-[var(--text-secondary)]">Your Leaderboard Rank</p>
            <p className="mt-1 font-semibold text-2xl">{me?.rank ?? "-"}</p>
          </div>
        </CardContent>
      </Card>

      {nextChallenge ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Next challenge unlock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[var(--text-primary)]">
              Day {nextChallenge.dayNumber}: ----
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Unlocks at {toPktLabel(nextChallenge.unlocksAt)} PKT
            </p>
            {countdown ? (
              <p className="text-sm text-[var(--accent-gold)]">
                {countdown.hours}h {countdown.minutes}m {countdown.seconds}s remaining
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="font-semibold text-lg">All 30 challenges are unlocked.</p>
              <p className="text-[var(--text-secondary)]">Push for the top leaderboard rank.</p>
            </div>
            <Link href="/leaderboard">
              <Button className="gold-button">
                <Trophy className="mr-2 size-4" />
                View leaderboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

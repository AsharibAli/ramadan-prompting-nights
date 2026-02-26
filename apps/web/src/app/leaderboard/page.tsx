"use client";

import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useState } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLeaderboard } from "@/api/ramadan.api";

const PAGE_SIZE = 100;

export default function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isPlaceholderData } = useGetLeaderboard(page, PAGE_SIZE);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

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

  // Top 3 only shown on page 1
  const isFirstPage = page === 1;
  const top3 = isFirstPage ? entries.slice(0, 3) : [];
  const rest = isFirstPage ? entries.slice(3) : entries;

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

      {/* Top 3 — only on first page */}
      {isFirstPage && (
        <div className="grid gap-3 sm:grid-cols-3">
          {top3.map((entry, idx) => (
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
      )}

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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 pt-4">
              <div className="flex items-center gap-1">
                <Button
                  className="size-8 border-[var(--border)] bg-transparent p-0 text-[var(--text-secondary)] transition-all hover:border-[var(--accent-gold)]/30 hover:bg-[var(--accent-gold-dim)] hover:text-[var(--accent-gold)]"
                  disabled={page === 1 || isPlaceholderData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  variant="outline"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <PaginationNumbers
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  disabled={isPlaceholderData}
                />

                <Button
                  className="size-8 border-[var(--border)] bg-transparent p-0 text-[var(--text-secondary)] transition-all hover:border-[var(--accent-gold)]/30 hover:bg-[var(--accent-gold-dim)] hover:text-[var(--accent-gold)]"
                  disabled={page === totalPages || isPlaceholderData}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  variant="outline"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Page {page} of {totalPages}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaginationNumbers({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            className="flex size-8 items-center justify-center text-xs text-[var(--text-secondary)]"
            key={`ellipsis-${i}`}
          >
            ...
          </span>
        ) : (
          <Button
            className={`size-8 p-0 text-xs transition-all ${
              p === currentPage
                ? "border-[var(--accent-gold)]/40 bg-[var(--accent-gold-dim)] text-[var(--accent-gold)] shadow-[0_0_12px_rgba(255,214,117,0.15)]"
                : "border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/30 hover:bg-[var(--accent-gold-dim)] hover:text-[var(--accent-gold)]"
            }`}
            disabled={disabled}
            key={p}
            onClick={() => onPageChange(p as number)}
            variant="outline"
          >
            {p}
          </Button>
        )
      )}
    </>
  );
}

/** Generates page numbers with ellipsis, e.g. [1, 2, 3, "...", 10] */
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  // Always show last page
  pages.push(total);

  return pages;
}

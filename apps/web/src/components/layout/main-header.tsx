"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowRight, MoonStar, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MainHeader() {
  const pathname = usePathname();
  const isLeaderboardRoute = pathname.startsWith("/leaderboard");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  return (
    <header className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 backdrop-blur-md md:mb-10 md:px-4 md:py-3">
      <Link className="group flex min-w-0 items-center gap-2" href="/">
        <MoonStar className="size-4 shrink-0 text-[var(--accent-gold)] md:size-5" />
        <p className="truncate font-display text-base text-[var(--text-primary)] transition group-hover:text-[var(--accent-gold)] md:text-xl">
          Ramadan Prompting Nights
        </p>
      </Link>
      <nav className="flex shrink-0 items-center gap-1.5 md:gap-2">
        {!isLeaderboardRoute ? (
          <Link href="/leaderboard">
            <Button
              aria-current={isLeaderboardRoute ? "page" : undefined}
              className={isDashboardRoute ? "gold-button gap-1" : "gap-1"}
              size="sm"
              variant={isDashboardRoute ? "default" : "ghost"}
            >
              <Trophy className="size-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Button>
          </Link>
        ) : null}
        <SignedOut>
          <Link href="/sign-in">
            <Button className="gold-button" size="sm">
              Join
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          {!isDashboardRoute ? (
            <Link href="/dashboard">
              <Button className="gold-button gap-1" size="sm">
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Go</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : null}
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}

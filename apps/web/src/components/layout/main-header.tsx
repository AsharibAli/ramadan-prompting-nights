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
    <header className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 backdrop-blur-md">
      <Link className="group flex items-center gap-2" href="/">
        <MoonStar className="size-5 text-[var(--accent-gold)]" />
        <p className="font-display text-lg text-[var(--text-primary)] transition group-hover:text-[var(--accent-gold)] md:text-xl">
          Ramadan Prompting Nights
        </p>
      </Link>
      <nav className="flex items-center gap-2">
        {!isLeaderboardRoute ? (
          <Link href="/leaderboard">
            <Button
              aria-current={isLeaderboardRoute ? "page" : undefined}
              className={isDashboardRoute ? "gold-button gap-1" : "gap-1"}
              size="sm"
              variant={isDashboardRoute ? "default" : "ghost"}
            >
              <Trophy className="size-4" />
              Leaderboard
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
                Dashboard <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : null}
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}

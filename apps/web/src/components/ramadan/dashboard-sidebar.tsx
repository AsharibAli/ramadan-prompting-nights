"use client";

import { Check, Lock, Menu, MoonStar, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GetChallengesResponse, MySubmissionsResponse } from "@/api/ramadan.api";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  challenges: GetChallengesResponse;
  submissions: MySubmissionsResponse;
}

interface SidebarContentProps extends DashboardSidebarProps {
  onToggle?: () => void;
}

function SidebarContent({ challenges, submissions, onToggle }: SidebarContentProps) {
  const pathname = usePathname();
  const submissionMap = useMemo(() => {
    return new Map(submissions.map((item) => [item.challengeId, item]));
  }, [submissions]);

  return (
    <div className="flex h-full flex-col border-r border-[var(--border)] bg-[var(--bg-card)]/80 px-3 py-4 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-2 px-2">
        <Link className="flex items-center gap-2" href="/" title="Go to home" aria-label="Go to home">
          <MoonStar className="size-4 shrink-0 text-[var(--accent-gold)]" />
          <span className="font-semibold text-[var(--text-primary)] text-sm tracking-wide">RPN</span>
        </Link>
        {onToggle ? (
          <Button
            className="size-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={onToggle}
            size="icon"
            type="button"
            variant="ghost"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        ) : null}
      </div>

      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-1">
          {challenges.map((challenge) => {
            const isActive = pathname === `/dashboard/day/${challenge.dayNumber}`;
            const isLocked = !challenge.isUnlocked;
            const userBest = submissionMap.get(challenge.id);

            const item = (
              <div
                className={cn(
                  "group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2.5 transition",
                  isActive && "border-[var(--accent-gold-dim)] bg-[var(--accent-gold-dim)]/40",
                  !isLocked && "hover:border-[var(--accent-gold-dim)] hover:bg-white/5",
                  isLocked && "cursor-not-allowed opacity-60"
                )}
              >
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs">
                  {challenge.dayNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--text-primary)]">
                    {isLocked ? "Locked" : challenge.title}
                  </p>
                  {userBest ? (
                    <p className="text-[11px] text-[var(--success)]">{userBest.weightedScore} pts</p>
                  ) : (
                    <p className="text-[11px] text-[var(--text-muted)]">{challenge.difficulty}</p>
                  )}
                </div>
                {isLocked ? (
                  <Lock className="size-3 shrink-0 text-[var(--text-muted)]" />
                ) : userBest ? (
                  <Check className="size-3 shrink-0 text-[var(--success)]" />
                ) : null}
              </div>
            );

            if (isLocked) {
              return (
                <Tooltip key={challenge.id}>
                  <TooltipTrigger asChild>
                    <div>{item}</div>
                  </TooltipTrigger>
                  <TooltipContent>Unlocks at 10:00 PM PKT</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link key={challenge.id} href={`/dashboard/day/${challenge.dayNumber}`}>
                {item}
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function DashboardSidebar({ challenges, submissions }: DashboardSidebarProps) {
  const [open, setOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-screen shrink-0 overflow-hidden transition-all duration-200 md:block",
          isDesktopOpen ? "w-[280px]" : "w-0"
        )}
      >
        <SidebarContent
          challenges={challenges}
          onToggle={() => setIsDesktopOpen(false)}
          submissions={submissions}
        />
      </aside>

      {/* Desktop collapsed — floating open button */}
      {!isDesktopOpen ? (
        <div className="fixed left-3 top-3 z-50 hidden md:block">
          <Button
            className="bg-[var(--accent-gold)] text-black hover:bg-[var(--accent-gold)]/90"
            onClick={() => setIsDesktopOpen(true)}
            size="icon"
            type="button"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      ) : null}

      {/* Mobile — hamburger + sheet */}
      <div className="fixed left-3 top-3 z-50 md:hidden">
        <Sheet onOpenChange={setOpen} open={open}>
          <SheetTrigger asChild>
            <Button
              aria-label="Open navigation"
              className="size-10 bg-[var(--accent-gold)] text-black hover:bg-[var(--accent-gold)]/90"
              size="icon"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="flex w-[80vw] max-w-xs flex-col border-[var(--border)] bg-[var(--bg-secondary)] p-0"
            side="left"
          >
            {/* Visually hidden title for screen readers */}
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {/* Explicit close button inside the sheet */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <MoonStar className="size-4 text-[var(--accent-gold)]" />
                <span className="font-semibold text-sm text-[var(--text-primary)] tracking-wide">RPN</span>
              </div>
              <Button
                aria-label="Close navigation"
                className="size-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => setOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </div>
            {/* Sidebar content without the duplicate header */}
            <div className="flex flex-1 flex-col overflow-hidden px-3 py-3">
              <ScrollArea className="flex-1 pr-1">
                <MobileSidebarList
                  challenges={challenges}
                  onClose={() => setOpen(false)}
                  submissions={submissions}
                />
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function MobileSidebarList({
  challenges,
  submissions,
  onClose,
}: DashboardSidebarProps & { onClose: () => void }) {
  const pathname = usePathname();
  const submissionMap = useMemo(() => {
    return new Map(submissions.map((item) => [item.challengeId, item]));
  }, [submissions]);

  return (
    <div className="space-y-1">
      {challenges.map((challenge) => {
        const isActive = pathname === `/dashboard/day/${challenge.dayNumber}`;
        const isLocked = !challenge.isUnlocked;
        const userBest = submissionMap.get(challenge.id);

        const item = (
          <div
            className={cn(
              "group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2.5 transition",
              isActive && "border-[var(--accent-gold-dim)] bg-[var(--accent-gold-dim)]/40",
              !isLocked && "hover:border-[var(--accent-gold-dim)] hover:bg-white/5",
              isLocked && "cursor-not-allowed opacity-60"
            )}
          >
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs">
              {challenge.dayNumber}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--text-primary)]">
                {isLocked ? "Locked" : challenge.title}
              </p>
              {userBest ? (
                <p className="text-[11px] text-[var(--success)]">{userBest.weightedScore} pts</p>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)]">{challenge.difficulty}</p>
              )}
            </div>
            {isLocked ? (
              <Lock className="size-3 shrink-0 text-[var(--text-muted)]" />
            ) : userBest ? (
              <Check className="size-3 shrink-0 text-[var(--success)]" />
            ) : null}
          </div>
        );

        if (isLocked) {
          return (
            <Tooltip key={challenge.id}>
              <TooltipTrigger asChild>
                <div>{item}</div>
              </TooltipTrigger>
              <TooltipContent side="right">Unlocks at 10:00 PM PKT</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link key={challenge.id} href={`/dashboard/day/${challenge.dayNumber}`} onClick={onClose}>
            {item}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSidebar } from "@/components/ramadan/dashboard-sidebar";
import { MainHeader } from "@/components/layout/main-header";
import { useGetChallenges, useGetMySubmissions } from "@/api/ramadan.api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: challenges, isLoading: isLoadingChallenges } = useGetChallenges();
  const { data: submissions, isLoading: isLoadingSubmissions } = useGetMySubmissions();

  if (isLoadingChallenges || isLoadingSubmissions || !challenges || !submissions) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-[280px] border-r border-[var(--border)] px-4 py-4 md:block">
          <Skeleton className="mb-3 h-6 w-40 bg-white/10" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton className="mb-2 h-10 w-full bg-white/10" key={i} />
          ))}
        </div>
        <main className="flex-1 p-4 md:p-8">
          <Skeleton className="mb-4 h-8 w-64 bg-white/10" />
          <Skeleton className="h-56 w-full bg-white/10" />
        </main>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-screen">
      <DashboardSidebar challenges={challenges} submissions={submissions} />
      <main className="min-w-0 flex-1 px-4 pt-16 pb-8 md:px-8 md:pt-8">
        <MainHeader />
        {children}
      </main>
    </div>
  );
}

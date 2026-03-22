"use client";

import { Award, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainHeader } from "@/components/layout/main-header";
import { Card, CardContent } from "@/components/ui/card";
import { verifyCertificate, type VerifyCertificateResponse } from "@/api/certificate.api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const verificationId = searchParams.get("id") ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["certificates", "verify", verificationId],
    queryFn: () => verifyCertificate(verificationId),
    enabled: !!verificationId,
    retry: false,
  });

  if (!verificationId) {
    return (
      <Card className="glass-card mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <XCircle className="size-12 text-red-400" />
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            No Verification ID Provided
          </h2>
          <p className="text-[var(--text-secondary)]">
            Please provide a valid verification ID in the URL.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="glass-card mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <Loader2 className="size-10 animate-spin text-[var(--accent-gold)]" />
          <p className="text-[var(--text-secondary)]">Verifying certificate...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.valid || !data?.certificate) {
    return (
      <Card className="glass-card mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <XCircle className="size-12 text-red-400" />
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Certificate Not Found
          </h2>
          <p className="text-[var(--text-secondary)]">
            No certificate found for verification ID{" "}
            <span className="font-mono text-[var(--text-primary)]">{verificationId}</span>.
            Please check the ID and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cert = data.certificate;
  const issueDateStr = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="glass-card mx-auto max-w-lg border-[var(--accent-gold)]/30">
      <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
        <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2">
          <CheckCircle2 className="size-5 text-green-400" />
          <span className="font-semibold text-green-400 text-sm">Verified Certificate</span>
        </div>

        <Award className="size-16 text-[var(--accent-gold)]" />

        <div className="space-y-1">
          <h2 className="font-display text-2xl text-[var(--text-primary)]">
            Certificate of Completion
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Ramadan Prompting Nights Challenge
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-[var(--text-secondary)]">Awarded to</p>
          <p className="font-display text-2xl text-[var(--accent-gold)]">
            {cert.userName}
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
            <p className="text-xs text-[var(--text-secondary)]">Challenges</p>
            <p className="mt-1 font-semibold">{cert.challengesCompleted}/30</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
            <p className="text-xs text-[var(--text-secondary)]">Total Score</p>
            <p className="mt-1 font-semibold">{cert.totalScore}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
            <p className="text-xs text-[var(--text-secondary)]">Rank</p>
            <p className="mt-1 font-semibold">#{cert.rank}</p>
          </div>
        </div>

        <div className="space-y-1 text-sm text-[var(--text-secondary)]">
          <p>
            Verification ID:{" "}
            <span className="font-mono text-[var(--text-primary)]">
              {cert.verificationId}
            </span>
          </p>
          <p>Issued on {issueDateStr}</p>
        </div>

        {data.imageUrl && (
          <img
            src={data.imageUrl}
            alt={cert.userName}
            className="size-16 rounded-full border-2 border-[var(--accent-gold)]/30"
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen">
      <MainHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Suspense
          fallback={
            <Card className="glass-card mx-auto max-w-lg">
              <CardContent className="flex flex-col items-center gap-4 p-8">
                <Loader2 className="size-10 animate-spin text-[var(--accent-gold)]" />
                <p className="text-[var(--text-secondary)]">Loading...</p>
              </CardContent>
            </Card>
          }
        >
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  );
}

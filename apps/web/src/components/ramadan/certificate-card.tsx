"use client";

import { Award, Download, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetMyCertificate,
  useClaimCertificate,
  downloadCertificatePdf,
} from "@/api/certificate.api";
import { toast } from "sonner";

export function CertificateCard() {
  const { data, isLoading } = useGetMyCertificate();
  const claimMutation = useClaimCertificate();
  const [downloading, setDownloading] = useState(false);

  if (isLoading) return null;

  const certificate = data?.certificate;
  const eligible = data?.eligible ?? false;

  // Not eligible - show progress
  if (!eligible && !certificate) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="size-5 text-[var(--text-secondary)]" />
            Certificate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--text-secondary)]">
            Complete all 30 challenges to earn your certificate of completion.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Eligible but not claimed
  if (eligible && !certificate) {
    return (
      <Card className="glass-card border-[var(--accent-gold)]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-[var(--accent-gold)]">
            <Award className="size-5" />
            Certificate Ready!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[var(--text-secondary)]">
            Congratulations! You&apos;ve completed all 30 challenges. Claim your
            certificate of completion now.
          </p>
          <Button
            className="gold-button w-full sm:w-auto"
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Award className="mr-2 size-4" />
            )}
            Claim Your Certificate
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Certificate issued
  if (certificate) {
    const issueDateStr = new Date(certificate.issuedAt).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
    const verifyUrl = `/verify?id=${certificate.verificationId}`;

    const handleDownload = async () => {
      setDownloading(true);
      try {
        await downloadCertificatePdf(certificate.id);
      } catch {
        toast.error("Failed to download certificate");
      } finally {
        setDownloading(false);
      }
    };

    const handleOpenVerify = async () => {
      const fullUrl = `${window.location.origin}${verifyUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Verification link copied!");
      window.open(fullUrl, "_blank");
    };

    return (
      <Card className="glass-card border-[var(--accent-gold)]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-[var(--accent-gold)]">
            <Award className="size-5" />
            Your Certificate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
              <p className="text-xs text-[var(--text-secondary)]">Verification ID</p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {certificate.verificationId}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
              <p className="text-xs text-[var(--text-secondary)]">Score at Issuance</p>
              <p className="mt-1 font-semibold text-sm">{certificate.totalScore}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
              <p className="text-xs text-[var(--text-secondary)]">Issued On</p>
              <p className="mt-1 font-semibold text-sm">{issueDateStr}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="gold-button"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleOpenVerify}>
              <ExternalLink className="mr-2 size-4" />
              Open Verification Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

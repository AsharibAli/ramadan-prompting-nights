"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  callRpc,
  getApiClient,
} from "@/api/client";
import { getToken } from "@/lib/clerk";

type CertificateData = {
  id: string;
  verificationId: string;
  userId: string;
  userName: string;
  totalScore: number;
  rank: number;
  challengesCompleted: number;
  issuedAt: string;
};

export type MyCertificateResponse = {
  certificate: CertificateData | null;
  eligible: boolean;
  completedCount: number;
};

export type VerifyCertificateResponse =
  | { valid: true; certificate: CertificateData; imageUrl: string | null }
  | { valid: false; certificate: null; imageUrl: null };

export async function getMyCertificate(): Promise<MyCertificateResponse> {
  const client = await getApiClient();
  return callRpc(client.certificates.me.$get()) as Promise<MyCertificateResponse>;
}

export async function claimCertificate(): Promise<CertificateData> {
  const client = await getApiClient();
  return callRpc(client.certificates.$post()) as Promise<CertificateData>;
}

export async function verifyCertificate(
  verificationId: string
): Promise<VerifyCertificateResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(
    `${baseUrl}/api/certificates/verify/${encodeURIComponent(verificationId)}`
  );
  if (!res.ok) {
    throw new Error("Verification failed");
  }
  return res.json();
}

export function useGetMyCertificate() {
  return useQuery({
    queryKey: ["certificates", "me"],
    queryFn: getMyCertificate,
  });
}

export function useClaimCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["certificates", "claim"],
    mutationFn: claimCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates", "me"] });
      toast.success("Certificate issued! You can now download it.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to claim certificate");
    },
  });
}

export async function downloadCertificatePdf(certId: string) {
  const token = await getToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${baseUrl}/api/certificates/${certId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to download certificate");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `RPN-Certificate.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

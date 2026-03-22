import { jsPDF } from "jspdf";
import type { Certificate } from "@repo/db";

const SITE_URL =
  process.env.SITE_URL || "https://ramadan-prompting-nights.vercel.app";

export function generateCertificatePdf(cert: Certificate): ArrayBuffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth(); // 297
  const h = doc.internal.pageSize.getHeight(); // 210
  const cx = w / 2;

  // ── White background ──────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");

  // ── Single thin border ────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, w - 24, h - 24);

  // ── Top accent line ───────────────────────────────────────────────
  doc.setDrawColor(45, 55, 72); // slate-700
  doc.setLineWidth(0.8);
  doc.line(cx - 40, 32, cx + 40, 32);

  // ── "CERTIFICATE OF COMPLETION" ───────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(150, 150, 150);
  doc.setCharSpace(4);
  doc.text("CERTIFICATE OF COMPLETION", cx, 44, { align: "center" });
  doc.setCharSpace(0);

  // ── Thin separator ────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(cx - 50, 50, cx + 50, 50);

  // ── "This is awarded to" ──────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text("This is awarded to", cx, 62, { align: "center" });

  // ── Participant name ──────────────────────────────────────────────
  doc.setFont("times", "bolditalic");
  doc.setFontSize(30);
  doc.setTextColor(30, 30, 30);
  doc.text(cert.userName, cx, 78, { align: "center" });

  // ── Line under name ───────────────────────────────────────────────
  const nameW = doc.getTextWidth(cert.userName);
  const lineHalf = Math.max(nameW / 2 + 10, 45);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(cx - lineHalf, 82, cx + lineHalf, 82);

  // ── Description ───────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "for successfully completing all 30 challenges of the",
    cx,
    95,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.text("Ramadan Prompting Nights Challenge", cx, 106, {
    align: "center",
  });

  // ── Stats ─────────────────────────────────────────────────────────
  const statsY = 124;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);

  const gap = 70;
  doc.text(`Score: ${cert.totalScore}`, cx - gap, statsY, { align: "center" });
  doc.text(`Rank: #${cert.rank}`, cx, statsY, { align: "center" });
  doc.text(
    `Completed: ${cert.challengesCompleted}/30`,
    cx + gap,
    statsY,
    { align: "center" }
  );

  // ── Thin dots between stats ───────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(cx - gap / 2 - 5, statsY - 3, cx - gap / 2 - 5, statsY + 1);
  doc.line(cx + gap / 2 + 5, statsY - 3, cx + gap / 2 + 5, statsY + 1);

  // ── Issue date ────────────────────────────────────────────────────
  const issueDateStr = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(issueDateStr, cx, 140, { align: "center" });

  // ── Bottom accent line ────────────────────────────────────────────
  doc.setDrawColor(45, 55, 72);
  doc.setLineWidth(0.8);
  doc.line(cx - 40, 152, cx + 40, 152);

  // ── Verification ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(cert.verificationId, cx, 162, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `${SITE_URL}/verify?id=${cert.verificationId}`,
    cx,
    168,
    { align: "center" }
  );

  return doc.output("arraybuffer");
}

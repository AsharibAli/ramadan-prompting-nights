import { jsPDF } from "jspdf";
import type { Certificate } from "@repo/db";

const SITE_URL =
  process.env.SITE_URL || "https://prompting.asharib.xyz";

// Accent color — full black
const ACCENT = { r: 0, g: 0, b: 0 };

export function generateCertificatePdf(cert: Certificate): ArrayBuffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth(); // 297
  const h = doc.internal.pageSize.getHeight(); // 210
  const cx = w / 2;

  // ── White background ──────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");

  // ── Double border ─────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.6);
  doc.rect(8, 8, w - 16, h - 16);

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, w - 24, h - 24);

  // ── Corner accents ────────────────────────────────────────────────
  const cornerLen = 12;
  const co = 8;
  doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.setLineWidth(0.6);
  // Top-left
  doc.line(co, co, co + cornerLen, co);
  doc.line(co, co, co, co + cornerLen);
  // Top-right
  doc.line(w - co, co, w - co - cornerLen, co);
  doc.line(w - co, co, w - co, co + cornerLen);
  // Bottom-left
  doc.line(co, h - co, co + cornerLen, h - co);
  doc.line(co, h - co, co, h - co - cornerLen);
  // Bottom-right
  doc.line(w - co, h - co, w - co - cornerLen, h - co);
  doc.line(w - co, h - co, w - co, h - co - cornerLen);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content — vertically centered
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let y = 34;

  // ── Branding: "Ramadan Prompting Nights" ──────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text("Ramadan Prompting Nights", cx, y, { align: "center" });
  y += 12;

  // ── Top accent line ───────────────────────────────────────────────
  doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.setLineWidth(0.8);
  doc.line(cx - 50, y, cx + 50, y);
  y += 16;

  // ── "CERTIFICATE OF COMPLETION" ───────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text("CERTIFICATE OF COMPLETION", cx, y, { align: "center" });
  y += 10;

  // ── Thin separator ────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(cx - 60, y, cx + 60, y);
  y += 13;

  // ── "This is awarded to" ──────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 100);
  doc.text("This is awarded to", cx, y, { align: "center" });
  y += 15;

  // ── Participant name ──────────────────────────────────────────────
  doc.setFont("times", "bolditalic");
  doc.setFontSize(38);
  doc.setTextColor(20, 20, 20);
  doc.text(cert.userName, cx, y, { align: "center" });
  y += 6;

  // ── Line under name ───────────────────────────────────────────────
  const nameW = doc.getTextWidth(cert.userName);
  const lineHalf = Math.max(nameW / 2 + 12, 55);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(cx - lineHalf, y, cx + lineHalf, y);
  y += 13;

  // ── Description ───────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text("for successfully completing all 30 challenges of the", cx, y, {
    align: "center",
  });
  y += 11;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(20, 20, 20);
  doc.text("Ramadan Prompting Nights Challenge", cx, y, {
    align: "center",
  });
  y += 15;

  // ── Stats row with pipe separators ────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const statsText = `Score: ${cert.totalScore}  |  Rank: #${cert.rank}  |  Completed: ${cert.challengesCompleted}/30`;
  doc.setTextColor(90, 90, 90);
  doc.text(statsText, cx, y, { align: "center" });
  y += 12;

  // ── Issue date ────────────────────────────────────────────────────
  const issueDateStr = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(issueDateStr, cx, y, { align: "center" });
  y += 11;

  // ── Bottom accent line ────────────────────────────────────────────
  doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.setLineWidth(0.8);
  doc.line(cx - 50, y, cx + 50, y);
  y += 10;

  // ── Issued by ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text("Issued by: Asharib Ali (Creator of RPN)", cx, y, {
    align: "center",
  });
  y += 10;

  // ── Verification ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text(cert.verificationId, cx, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `${SITE_URL}/verify?id=${cert.verificationId}`,
    cx,
    y,
    { align: "center" }
  );

  return doc.output("arraybuffer");
}

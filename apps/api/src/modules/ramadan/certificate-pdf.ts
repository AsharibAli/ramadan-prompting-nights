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

  // ── Single clean border ──────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.rect(5, 5, w - 10, h - 10);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Content — vertically centered
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let y = 14;

  // ── RPN Logo (moon crescent + star) ───────────────────────────────
  // Matches the SVG: viewBox 0 0 64 64
  // <circle cx="30" cy="35" r="16" fill="#ffd675"/>  (gold moon)
  // <circle cx="36" cy="31" r="14" fill="#0a0e27"/>  (dark cutout → crescent)
  // <path d="M46 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/> (4-point star)
  const logoSize = 14;
  const s = logoSize / 64; // scale factor
  const lx = cx - logoSize / 2; // logo origin X
  const ly = y; // logo origin Y
  const logoCx = cx;
  const logoCy = ly + logoSize / 2;

  // Dark circular background (full circle)
  doc.setFillColor(10, 14, 39); // #0a0e27
  doc.circle(logoCx, logoCy, logoSize / 2, "F");

  // Gold moon circle — cx=30 cy=35 r=16 in SVG coords
  doc.setFillColor(255, 214, 117); // #ffd675
  doc.circle(lx + 30 * s, ly + 35 * s, 16 * s, "F");

  // Dark cutout circle — cx=36 cy=31 r=14 in SVG coords
  doc.setFillColor(10, 14, 39);
  doc.circle(lx + 36 * s, ly + 31 * s, 14 * s, "F");

  // 4-point star — SVG path: M46 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z
  // Points: (46,14)→(48,19)→(53,21)→(48,23)→(46,28)→(44,23)→(39,21)→(44,19)
  doc.setFillColor(255, 214, 117);
  const sx = lx + 46 * s;
  const sy = ly + 14 * s;
  // lines() takes relative deltas from the starting point
  doc.lines(
    [
      [2 * s, 5 * s],
      [5 * s, 2 * s],
      [-5 * s, 2 * s],
      [-2 * s, 5 * s],
      [-2 * s, -5 * s],
      [-5 * s, -2 * s],
      [5 * s, -2 * s],
      [2 * s, -5 * s],
    ],
    sx,
    sy,
    [1, 1],
    "F",
    true
  );

  y += logoSize + 8;

  // ── Branding: "Ramadan Prompting Nights" ──────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text("Ramadan Prompting Nights", cx, y, { align: "center" });
  y += 10;

  // ── Top accent line ───────────────────────────────────────────────
  doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.setLineWidth(0.8);
  doc.line(cx - 50, y, cx + 50, y);
  y += 14;

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

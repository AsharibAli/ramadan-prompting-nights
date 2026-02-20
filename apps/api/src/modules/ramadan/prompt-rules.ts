const REQUIRED_SECTIONS = ["Goal", "Constraints", "Edge Cases", "Output Format"] as const;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasSection(prompt: string, section: (typeof REQUIRED_SECTIONS)[number]) {
  const lowered = normalize(prompt);
  const sectionLower = section.toLowerCase();
  return (
    lowered.includes(`${sectionLower}:`) ||
    lowered.includes(`## ${sectionLower}`) ||
    lowered.includes(`# ${sectionLower}`)
  );
}

export function validateStructuredPrompt(prompt: string) {
  const missingSections = REQUIRED_SECTIONS.filter((section) => !hasSection(prompt, section));
  return {
    isValid: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Score prompt quality on a 0–100 scale using three additive components:
 *
 *   Structure  (60 pts) — 15 per required section (Goal, Constraints, Edge Cases, Output Format)
 *   Depth      (20 pts) — linear ramp from 0 at 0 chars to 20 at ≥200 chars
 *   Specificity(20 pts) — ~2.86 per constraint keyword hit, capped at 20
 *
 * The three components sum to exactly 100 at maximum. No clamping overshoot.
 */
export function scorePromptQuality(prompt: string) {
  const trimmed = prompt.trim();
  const lowered = normalize(trimmed);

  // ── Structure: 15 pts × 4 sections = 60 pts max ──
  const POINTS_PER_SECTION = 15;
  const structureScore = REQUIRED_SECTIONS.reduce(
    (score, section) => score + (hasSection(trimmed, section) ? POINTS_PER_SECTION : 0),
    0
  );

  // ── Depth: continuous 0–20 based on prompt length ──
  // Linear ramp: 0 at 0 chars, 20 at ≥200 chars
  const MAX_DEPTH = 20;
  const DEPTH_THRESHOLD = 200;
  const depthScore = Math.min(MAX_DEPTH, Math.round((trimmed.length / DEPTH_THRESHOLD) * MAX_DEPTH));

  // ── Specificity: keyword presence, 0–20 pts ──
  const CONSTRAINT_KEYWORDS = ["must", "should", "avoid", "handle", "return", "input", "output"];
  const MAX_SPECIFICITY = 20;
  const keywordHits = CONSTRAINT_KEYWORDS.reduce(
    (count, keyword) => count + (lowered.includes(keyword) ? 1 : 0),
    0
  );
  // Each keyword contributes proportionally: 20/7 ≈ 2.86 pts
  const specificityScore = Math.min(
    MAX_SPECIFICITY,
    Math.round((keywordHits / CONSTRAINT_KEYWORDS.length) * MAX_SPECIFICITY)
  );

  return structureScore + depthScore + specificityScore;
}

export function getPromptFormatHint() {
  return "Use structured prompt sections: Goal, Constraints, Edge Cases, Output Format.";
}


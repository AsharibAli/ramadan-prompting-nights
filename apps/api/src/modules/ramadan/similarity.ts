function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokenSet(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return new Set<string>();
  return new Set(normalized.split(" ").filter(Boolean));
}

export function calculateJaccardSimilarity(a: string, b: string) {
  const setA = toTokenSet(a);
  const setB = toTokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function getHighestSimilarity(candidate: string, references: string[]) {
  return references.reduce((highest, reference) => {
    const score = calculateJaccardSimilarity(candidate, reference);
    return score > highest ? score : highest;
  }, 0);
}


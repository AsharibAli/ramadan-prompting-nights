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

export function scorePromptQuality(prompt: string) {
  const trimmed = prompt.trim();
  const sectionScore = REQUIRED_SECTIONS.reduce((score, section) => {
    return score + (hasSection(trimmed, section) ? 22 : 0);
  }, 0);

  const lengthScore = trimmed.length >= 140 ? 8 : trimmed.length >= 90 ? 5 : 2;
  const constraintKeywords = ["must", "should", "avoid", "handle", "return", "input", "output"];
  const keywordHits = constraintKeywords.reduce((count, keyword) => {
    return count + (normalize(trimmed).includes(keyword) ? 1 : 0);
  }, 0);
  const keywordScore = Math.min(10, keywordHits * 2);

  return Math.min(100, sectionScore + lengthScore + keywordScore);
}

export function getPromptFormatHint() {
  return "Use structured prompt sections: Goal, Constraints, Edge Cases, Output Format.";
}


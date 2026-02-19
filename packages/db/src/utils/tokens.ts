export function estimateTokens(text: string): number {
  if (!text?.trim()) return 0;
  const words = text.trim().split(/\s+/).length;
  const specialChars = (text.match(/[{}()\[\];=><+\-*/&|!.,:`'"]/g) || []).length;
  return Math.ceil(words * 1.3 + specialChars * 0.3);
}

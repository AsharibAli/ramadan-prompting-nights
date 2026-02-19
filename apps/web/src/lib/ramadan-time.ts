export function toPktLabel(dateLike: string | Date) {
  const date = new Date(dateLike);
  return date.toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getCountdownParts(unlocksAt: string | Date) {
  const target = new Date(unlocksAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { totalMs: diff, hours, minutes, seconds };
}

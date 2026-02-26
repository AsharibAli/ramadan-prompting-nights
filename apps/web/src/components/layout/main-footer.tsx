"use client";

import { usePathname } from "next/navigation";

export function MainFooter({ force }: { force?: boolean }) {
  const pathname = usePathname();

  // On dashboard pages, the footer is rendered inside the dashboard layout
  // so the root-level footer hides itself to avoid duplication.
  if (!force && pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="relative z-10 px-4 pb-6 text-center text-[var(--text-muted)] text-sm">
      Build with 🤍 by{" "}
      <a
        className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-gold)]"
        href="https://github.com/asharibali"
        rel="noopener noreferrer"
        target="_blank"
      >
        Asharib Ali
      </a>
    </footer>
  );
}

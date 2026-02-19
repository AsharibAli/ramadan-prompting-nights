"use client";

import { dark } from "@clerk/themes";
import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export default function SignInPage() {
  const { theme } = useTheme();

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center">
      <SignIn appearance={{ baseTheme: theme === "dark" ? dark : undefined }} fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

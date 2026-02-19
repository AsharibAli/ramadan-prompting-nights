import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, Playfair_Display } from "next/font/google";
import { Starfield } from "@/components/ramadan/starfield";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";
import { VercelAnalytics } from "@/lib/analytics/vercel";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers/providers";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ramadan Prompting Nights",
  description: "30 nights. 30 challenges. Fewest tokens wins.",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});
interface RootLayoutProps {
  children: React.ReactNode;
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html suppressHydrationWarning lang="en">
        <head>{/* <GoogleAnalytics gaId="G-2L23D2FV55" /> */}</head>

        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            playfair.variable,
            outfit.variable,
            jetbrainsMono.variable
          )}
        >
          <Starfield />
          <Providers attribute="class" defaultTheme="system" enableSystem>
            {children}
            <TailwindIndicator />
            <Toaster />
          </Providers>
          <VercelAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

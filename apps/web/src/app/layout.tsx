import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, Playfair_Display } from "next/font/google";
import { MainFooter } from "@/components/layout/main-footer";
import { Starfield } from "@/components/ramadan/starfield";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";
import { VercelAnalytics } from "@/lib/analytics/vercel";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers/providers";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Ramadan Prompting Nights",
  description: "Scenario-based prompting competition. 30 nights. 30 real-world coding scenarios.",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "700"],
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
            <div className="flex min-h-screen flex-col">
              <main className="flex-1">{children}</main>
              <MainFooter />
            </div>
            <TailwindIndicator />
            <Toaster />
          </Providers>
          <VercelAnalytics />
          <Script
            strategy="afterInteractive"
            src="https://www.googletagmanager.com/gtag/js?id=G-15R782D1Z4"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-15R782D1Z4');`}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, MoonStar, Star } from "lucide-react";
import Link from "next/link";
import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      {/* Sticky announcement bar */}
      <section className="sticky top-0 z-50 w-full border-y border-[var(--border)] bg-gradient-to-r from-[#231f4a] via-[#0f2b4a] to-[#0f3f45] px-4 py-2 text-center text-sm text-[var(--text-primary)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
          <span className="text-xs sm:text-sm">How to participate in this Challenge (step-by-step)?</span>
          <a
            className="inline-flex items-center gap-1 font-semibold text-[var(--accent-gold)] underline-offset-4 hover:underline"
            href="https://youtu.be/BybNZEAgh9Y"
            rel="noopener noreferrer"
            target="_blank"
          >
            Watch the Video
            <ArrowRight className="size-3.5" />
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <MainHeader />

        <section className="animate-fade-up space-y-6 text-center md:space-y-8">
          <div className="inline-flex rounded-full bg-[var(--accent-gold-dim)] p-3 md:p-4">
            <MoonStar className="size-8 text-[var(--accent-gold)] md:size-10" />
          </div>
          <h1 className="font-display text-4xl text-[var(--text-primary)] sm:text-5xl md:text-7xl">
            Ramadan Prompting Nights
          </h1>
          <p className="mx-auto max-w-2xl text-base text-[var(--text-secondary)] md:text-lg">
            Scenario-based prompting competition. 30 nights. 30 real-world coding scenarios.
          </p>
          <p className="text-sm text-[var(--text-muted)]">by Sir Asharib Ali · for GIAIC Students</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <SignedOut>
              <Link className="w-full sm:w-auto" href="/sign-in">
                <Button className="gold-button w-full sm:w-auto">
                  Join the Challenge <ArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link className="w-full sm:w-auto" href="/dashboard">
                <Button className="gold-button w-full sm:w-auto">
                  Start the Challenge <ArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
            </SignedIn>
            <a
              className="w-full sm:w-auto"
              href="https://github.com/AsharibAli/ramadan-prompting-nights"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Button
                className="w-full border-[var(--border)] bg-white/5 text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold-dim)] sm:w-auto"
                size="lg"
                variant="outline"
              >
                <Star className="mr-1 size-4 text-[var(--accent-gold)]" />
                Star Repository
              </Button>
            </a>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3 md:mt-14">
          {[
            ["Write a Structured Prompt", "Use Goal, Constraints, Edge Cases, and Output Format."],
            ["Run Tests", "Validate generated code against challenge test cases."],
            ["Submit", "Passed code gets a weighted score out of 100: Prompt Quality 60 + Correctness 20 + Efficiency 20."],
          ].map(([title, description], index) => (
            <Card className="glass-card stagger-item" key={title} style={{ animationDelay: `${index * 0.05}s` }}>
              <CardHeader>
                <CardTitle className="font-display">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-[var(--text-secondary)]">{description}</CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display">Scoring Example</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3">
                <p className="text-sm text-[var(--text-secondary)]">Prompt Quality (85/100)</p>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs md:text-sm">
{`- Goal: build robust validation utility.
- Constraints: handle null/empty safely.
- Edge Cases: missing fields, invalid email.
- Output Format: return error array.

`}<strong>Quality points = 85% of 60 = <span className="text-[var(--accent-gold)]">51</span></strong>
                </pre>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3">
                <p className="text-sm text-[var(--text-secondary)]">Correctness (100/100)</p>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs md:text-sm">
{`- All tests passed: yes
- Required function name matched
- Output format matched expected shape


`}<strong>Correctness points = 100% of 20 = <span className="text-[var(--accent-gold)]">20</span></strong>
                </pre>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3">
                <p className="text-sm text-[var(--text-secondary)]">Efficiency (80/100)</p>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs md:text-sm">
{`- Prompt tokens: 42
- Code tokens: 74
- Total efficiency tokens: 116


`}<strong>Efficiency points = 80% of 20 = <span className="text-[var(--accent-gold)]">16</span></strong>
                </pre>
              </div>
              <p className="font-semibold text-[var(--accent-gold)] md:col-span-3">
                Final Weighted Score: 87 / 100 (higher is better)
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

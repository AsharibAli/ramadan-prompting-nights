import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Code2, MoonStar } from "lucide-react";
import Link from "next/link";
import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <MainHeader />

      <section className="animate-fade-up space-y-8 text-center">
        <div className="inline-flex rounded-full bg-[var(--accent-gold-dim)] p-4">
          <MoonStar className="size-10 text-[var(--accent-gold)]" />
        </div>
        <h1 className="font-display text-5xl text-[var(--text-primary)] md:text-7xl">
          Ramadan Prompting Nights
        </h1>
        <p className="mx-auto max-w-2xl text-[var(--text-secondary)] text-lg">
          Scenario-based prompting competition. 30 nights. 30 real-world coding scenarios.
        </p>
        <p className="text-sm text-[var(--text-muted)]">by Sir Asharib Ali · for GIAIC Students</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SignedOut>
            <Link href="/sign-in">
              <Button className="gold-button">
                Join the Challenge <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button className="gold-button">
                Start the Challenge <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </SignedIn>
          <a
            href="https://github.com/AsharibAli/ramadan-prompting-nights"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Button
              className="border-[var(--border)] bg-white/5 text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold-dim)]"
              size="lg"
              variant="outline"
            >
              <Code2 className="mr-2 size-4" />
              See Codebase
            </Button>
          </a>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
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
              <pre className="mt-2 font-mono text-sm whitespace-pre-wrap">
- Goal: build robust validation utility. <br />
- Constraints: handle null/empty safely. <br />
- Edge Cases: missing fields, invalid email. <br />
- Output Format: return error array. <br />
<br />
<strong>Quality points = 85% of 60 = <span className="text-[var(--accent-gold)]">51</span></strong> <br />
              </pre>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3">
              <p className="text-sm text-[var(--text-secondary)]">Correctness (100/100)</p>
              <pre className="mt-2 font-mono text-sm whitespace-pre-wrap">
- All tests passed: yes <br />
- Required function name matched <br />
- Output format matched expected shape <br />
<br />
<br />
<strong>Correctness points = 100% of 20 = <span className="text-[var(--accent-gold)]">20</span></strong> <br />
              </pre>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3">
              <p className="text-sm text-[var(--text-secondary)]">Efficiency (80/100)</p>
              <pre className="mt-2 font-mono text-sm whitespace-pre-wrap">
- Prompt tokens: 42 <br />
- Code tokens: 74 <br />
- Total efficiency tokens: 116 <br />
<br />
<br />
<strong>Efficiency points = 80% of 20 = <span className="text-[var(--accent-gold)]">16</span></strong> <br />
              </pre>
            </div>
            <p className="font-semibold text-[var(--accent-gold)] md:col-span-3">
              Final Weighted Score: 87 / 100 (higher is better)
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="mt-10 pb-8 text-center text-[var(--text-muted)] text-sm">
        Build with 🤍 by {" "}
        <a href="https://github.com/asharibali" target="_blank" rel="noopener noreferrer">
            <strong>Asharib Ali</strong>
          </a>
      </footer>
    </div>
  );
}

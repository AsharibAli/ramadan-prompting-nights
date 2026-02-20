"use client";

import { ArrowLeft, Loader2, Lock, MoonStar, Play } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSubmission,
  useGenerateCode,
  useGetChallenge,
  useGetChallenges,
  useGetMySubmissions,
} from "@/api/ramadan.api";
import { estimateTokens } from "@repo/db/utils/tokens";
import { runChallengeTest, type TestResult } from "@/lib/challenge-test-runner";
import { getCountdownParts, toPktLabel } from "@/lib/ramadan-time";

interface NumberedTestResult extends TestResult {
  testNumber: number;
}

function difficultyClassName(difficulty: string) {
  if (difficulty === "Easy") return "bg-emerald-500/20 text-emerald-300";
  if (difficulty === "Medium") return "bg-amber-500/20 text-amber-300";
  return "bg-red-500/20 text-red-300";
}

const REQUIRED_SECTIONS = ["Goal", "Constraints", "Edge Cases", "Output Format"] as const;

function hasPromptSections(prompt: string) {
  const lowered = prompt.toLowerCase();
  return REQUIRED_SECTIONS.every((section) => lowered.includes(`${section.toLowerCase()}:`));
}

export default function ChallengeSolverPage() {
  const params = useParams<{ dayNumber: string }>();
  const dayNumber = Number(params.dayNumber);

  const [prompt, setPrompt] = useState("");
  const [generation, setGeneration] = useState({ code: "", promptTokens: 0, codeTokens: 0 });
  const { code: generatedCode, promptTokens, codeTokens } = generation;
  const [results, setResults] = useState<NumberedTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const { data: challenges = [] } = useGetChallenges();
  const { data: mySubmissions = [] } = useGetMySubmissions();
  const selectedChallengeMeta = challenges.find((item) => item.dayNumber === dayNumber);
  const isUnlocked = !!selectedChallengeMeta?.isUnlocked;

  const {
    data: challengeData,
    isLoading: isChallengeLoading,
    isError: isChallengeError,
  } = useGetChallenge(dayNumber, isUnlocked);
  const challenge = challengeData as
    | {
        id: number;
        dayNumber: number;
        title: string;
        description: string;
        functionName: string;
        exampleInput: string;
        exampleOutput: string;
        difficulty: string;
        testCases: Array<{ input: unknown; expected: unknown }>;
      }
    | undefined;

  const generateMutation = useGenerateCode();
  const submissionMutation = useCreateSubmission();

  const bestForCurrent = selectedChallengeMeta
    ? mySubmissions.find((item) => item.challengeId === selectedChallengeMeta.id)
    : undefined;

  const totalTokens = promptTokens + codeTokens;
  const allPassed = results.length > 0 && results.every((item) => item.passed);

  const countdown = selectedChallengeMeta ? getCountdownParts(selectedChallengeMeta.unlocksAt) : null;

  const handleGenerate = async () => {
    if (!challenge) return;
    if (!prompt.trim()) {
      toast.error("Please write a prompt first.");
      return;
    }
    if (!hasPromptSections(prompt)) {
      toast.error("Use sections: Goal, Constraints, Edge Cases, Output Format.");
      return;
    }
    const response = await generateMutation.mutateAsync({
      prompt,
      challengeDescription: challenge.description,
      functionName: challenge.functionName,
    });
    setGeneration({ code: response.code, promptTokens: response.promptTokens, codeTokens: response.codeTokens });
    setResults([]);
  };

  const runTests = async () => {
    if (!challenge || !generatedCode.trim()) return;
    setIsRunningTests(true);
    const tests = challenge.testCases as Array<{ input: unknown; expected: unknown }>;
    const output = await Promise.all(
      tests.map((testCase) =>
        runChallengeTest({
          code: generatedCode,
          functionName: challenge.functionName,
          testCase,
          dayNumber,
        })
      )
    );
    setResults(output.map((r, i) => ({ ...r, testNumber: i + 1 })));
    setIsRunningTests(false);
  };

  const handleSubmit = async () => {
    if (!challenge || !allPassed) return;
    if (!hasPromptSections(prompt)) {
      toast.error("Prompt format invalid. Add Goal, Constraints, Edge Cases, Output Format.");
      return;
    }

    const payload = {
      challengeId: challenge.id,
      prompt,
      generatedCode,
    };

    const response = await submissionMutation.mutateAsync(payload);
    if (response.isNewBest) {
      toast.success(`🎉 New best! ${response.weightedScore} points`);
    } else {
      toast.success(`Submitted! ${response.weightedScore} points`);
    }
  };

  const clientPromptTokens = useMemo(() => estimateTokens(prompt), [prompt]);

  if (!selectedChallengeMeta) {
    return <p className="text-[var(--text-secondary)]">Challenge not found.</p>;
  }

  if (!isUnlocked) {
    return (
      <Card className="glass-card mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Lock className="size-10 text-[var(--accent-gold)]" />
          <p className="font-semibold text-2xl text-[var(--text-primary)]">Day {dayNumber} is locked</p>
          <p className="text-[var(--text-secondary)]">Unlocks at {toPktLabel(selectedChallengeMeta.unlocksAt)} PKT</p>
          <p className="text-[var(--accent-gold)]">
            Unlocks in {countdown?.hours ?? 0}h {countdown?.minutes ?? 0}m {countdown?.seconds ?? 0}s
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isChallengeLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40 bg-white/10" />
        <Skeleton className="h-40 w-full bg-white/10" />
        <Skeleton className="h-24 w-full bg-white/10" />
      </div>
    );
  }

  if (isChallengeError || !challenge) {
    return <p className="text-red-300">Unable to load challenge details right now.</p>;
  }

  return (
    <div className="space-y-4 pb-10">
      
      <Link
        href="/dashboard"
        className="flex items-center gap-0.5 group transition-colors"
      >
        <ArrowLeft className="mr-0.5 size-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </Link>

      <Card className="glass-card animate-fade-up">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[var(--accent-gold-dim)] text-[var(--accent-gold)]">Day {challenge.dayNumber}</Badge>
            <Badge className={difficultyClassName(challenge.difficulty)}>{challenge.difficulty}</Badge>
            <Badge className="bg-purple-500/20 text-purple-300">Weighted scoring</Badge>
          </div>
          <CardTitle className="font-display text-3xl text-[var(--text-primary)]">{challenge.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="font-medium text-sm text-[var(--text-primary)]">Scenario:</p>
            <p className="text-[var(--text-secondary)]">{challenge.description}</p>
          </div>
          <p className="font-medium text-sm text-[var(--text-primary)]">Example Output:</p>
          <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3 font-mono text-sm">
            {challenge.exampleInput} {"->"} {challenge.exampleOutput}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl">Your Prompt:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[110px] border-[var(--border)] bg-black/20 text-[var(--text-primary)]"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={`Goal: ...\nConstraints: ...\nEdge Cases: ...\nOutput Format: ...`}
            value={prompt}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--text-secondary)]">Prompt efficiency: {clientPromptTokens} tokens</p>
            <Button className="gold-button" disabled={generateMutation.isPending} onClick={handleGenerate}>
              {generateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MoonStar className="mr-2 size-4" />}
              {generateMutation.isPending ? "Generating..." : "Generate Code"}
            </Button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Required format: <strong>Goal, Constraints, Edge Cases, Output Format</strong>. 
            <br /><br />
            Copying scenario text will be rejected (Ramadan mein bhi cheating karogy kya? 😅).
          </p>
        </CardContent>
      </Card>

      {generatedCode ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Generated Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="max-h-72 rounded-lg border border-[var(--border)] bg-black/25 p-3">
              <pre className="font-mono text-sm text-[var(--text-primary)] whitespace-pre-wrap">{generatedCode}</pre>
            </ScrollArea>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-[var(--text-secondary)]">Prompt tokens: {promptTokens}</span>
              <span className="text-[var(--text-secondary)]">Code tokens: {codeTokens}</span>
              <span className="rounded bg-[var(--accent-gold-dim)] px-2 py-1 font-semibold text-[var(--accent-gold)]">
                Efficiency total: {totalTokens}
              </span>
            </div>

            <Button disabled={isRunningTests} onClick={runTests} variant="secondary">
              {isRunningTests ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
              Run Tests
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {results.length > 0 ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className={allPassed ? "text-[var(--success)]" : "text-[var(--error)]"}>
              {allPassed ? "✓ All Passed!" : `✗ ${results.filter((r) => !r.passed).length} failed`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((result) => (
              <div className="rounded border border-[var(--border)] p-3" key={`test-${result.testNumber}`}>
                <p className="text-xs text-[var(--text-secondary)]">Test {result.testNumber}</p>
                <p className={result.passed ? "text-[var(--success)]" : "text-[var(--error)]"}>
                  {result.passed ? "Pass" : `Fail - got: ${String(result.got)}`}
                </p>
              </div>
            ))}

            <Separator className="bg-[var(--border)]" />
            {allPassed ? (
              <Button
                className="gold-button w-full"
                disabled={submissionMutation.isPending}
                onClick={handleSubmit}
              >
                {submissionMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <MoonStar className="mr-2 size-4" />
                )}
                Submit for weighted scoring
              </Button>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Refine your prompt and regenerate.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {bestForCurrent ? (
        <Card className="glass-card">
          <CardContent className="p-4 text-sm text-[var(--text-secondary)]">
            Your best: <span className="font-semibold text-[var(--accent-gold)]">{bestForCurrent.weightedScore}</span>{" "}
            points. Beat it!
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

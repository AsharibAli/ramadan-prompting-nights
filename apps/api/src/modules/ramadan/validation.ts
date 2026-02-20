export type ChallengeTestCase = { input: unknown; expected: unknown };

/** Deep equality with sorted keys to handle different key ordering in objects */
function isEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

/** JSON.stringify with sorted keys for consistent comparison */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const sorted = Object.keys(value as Record<string, unknown>).sort();
  return `{${sorted.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(",")}}`;
}

/**
 * Execute user code in a sandboxed closure that strips dangerous globals.
 * Wraps in strict mode and shadows process, require, Bun, etc.
 */
function executeSandboxed(code: string, functionName: string): { fn: Function | null; error?: string } {
  try {
    const safeCode = `
      "use strict";
      const process = undefined;
      const require = undefined;
      const global = undefined;
      const globalThis = undefined;
      const Bun = undefined;
      const Deno = undefined;
      ${code}
      return ${functionName};
    `;
    const fn = new Function(safeCode)();
    if (typeof fn !== "function") {
      return { fn: null, error: `Expected \`${functionName}\` to be a function.` };
    }
    return { fn };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { fn: null, error: `Code compilation failed: ${message}` };
  }
}

export function validateGeneratedCodeAgainstTests({
  code,
  functionName,
  testCases,
}: {
  code: string;
  functionName: string;
  testCases: ChallengeTestCase[];
}) {
  try {
    const { fn, error } = executeSandboxed(code, functionName);
    if (!fn) {
      return {
        passed: false,
        passedCount: 0,
        totalCount: testCases.length,
        correctnessScore: 0,
        reason: error || `Expected \`${functionName}\` to be a function.`,
      };
    }

    let passedCount = 0;
    for (let i = 0; i < testCases.length; i += 1) {
      const test = testCases[i];
      if (!test) {
        return {
          passed: false,
          passedCount,
          totalCount: testCases.length,
          correctnessScore: testCases.length
            ? Math.round((passedCount / testCases.length) * 100)
            : 0,
          reason: `Invalid test case at index ${i}.`,
        };
      }
      const args = Array.isArray(test.input) ? test.input : [test.input];
      try {
        const result = fn(...args);
        if (isEqual(result, test.expected)) passedCount += 1;
      } catch {
        // Test case failed due to runtime error — counts as failed
      }
    }

    const totalCount = testCases.length;
    const correctnessScore = totalCount ? Math.round((passedCount / totalCount) * 100) : 0;
    return {
      passed: passedCount === totalCount,
      passedCount,
      totalCount,
      correctnessScore,
      reason:
        passedCount === totalCount
          ? undefined
          : `Failed ${totalCount - passedCount} of ${totalCount} server tests.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown execution error";
    return {
      passed: false as const,
      passedCount: 0,
      totalCount: testCases.length,
      correctnessScore: 0,
      reason: `Code execution failed: ${message}`,
    };
  }
}

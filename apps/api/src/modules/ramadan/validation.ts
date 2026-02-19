export type ChallengeTestCase = { input: unknown; expected: unknown };

function isEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
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
    const fn = new Function(`${code}\nreturn ${functionName};`)();
    if (typeof fn !== "function") {
      return {
        passed: false,
        passedCount: 0,
        totalCount: testCases.length,
        correctnessScore: 0,
        reason: `Expected \`${functionName}\` to be a function.`,
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
          correctnessScore: testCases.length ? Math.round((passedCount / testCases.length) * 100) : 0,
          reason: `Invalid test case at index ${i}.`,
        };
      }
      const args = Array.isArray(test.input) ? test.input : [test.input];
      const result = fn(...args);
      if (isEqual(result, test.expected)) passedCount += 1;
    }

    const totalCount = testCases.length;
    const correctnessScore = totalCount ? Math.round((passedCount / totalCount) * 100) : 0;
    return {
      passed: passedCount === totalCount,
      passedCount,
      totalCount,
      correctnessScore,
      reason: passedCount === totalCount ? undefined : `Failed ${totalCount - passedCount} of ${totalCount} server tests.`,
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


export interface TestCase {
  input: unknown;
  expected: unknown;
}

export interface TestResult {
  passed: boolean;
  got: unknown;
}

function isEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function runChallengeTest({
  code,
  functionName,
  testCase,
  dayNumber,
}: {
  code: string;
  functionName: string;
  testCase: TestCase;
  dayNumber: number;
}): Promise<TestResult> {
  try {
    if (dayNumber === 22) {
      const curry = new Function(`${code}; return curry;`)() as (fn: (...args: number[]) => number) => unknown;
      const { arity, mode, values } = testCase.input as {
        arity: number;
        mode: "single" | "grouped" | "partial" | "mixed";
        values: number[];
      };
      const baseFn = (...args: number[]) => args.reduce((acc, value) => acc + value, 0);
      Object.defineProperty(baseFn, "length", { value: arity });
      const curried = curry(baseFn) as any;
      let got: unknown;
      if (mode === "single") got = curried(values[0])(values[1]);
      else if (mode === "grouped") got = curried(values[0], values[1]);
      else if (mode === "partial") got = curried(values[0])(values[1], values[2]);
      else got = curried(values[0], values[1])(values[2]);
      return { passed: isEqual(got, testCase.expected), got };
    }

    if (dayNumber === 23) {
      const promisePool = new Function(`${code}; return promisePool;`)() as (
        tasks: Array<() => Promise<unknown>>,
        limit: number
      ) => Promise<unknown[]>;
      const { delays, values, limit } = testCase.input as {
        delays: number[];
        values: unknown[];
        limit: number;
      };
      const tasks = values.map((value, index) => () =>
        new Promise<unknown>((resolve) => {
          setTimeout(() => resolve(value), delays[index] ?? 0);
        })
      );
      const got = await promisePool(tasks, limit);
      return { passed: isEqual(got, testCase.expected), got };
    }

    if (dayNumber === 24) {
      const LRUCache = new Function(`${code}; return LRUCache;`)() as (capacity: number) => any;
      const { capacity, ops } = testCase.input as {
        capacity: number;
        ops: Array<[string, number, number?]>;
      };
      const cache = new (LRUCache as any)(capacity);
      const got = ops.map(([op, key, value]) => {
        if (op === "put") {
          cache.put(key, value);
          return null;
        }
        return cache.get(key);
      });
      return { passed: isEqual(got, testCase.expected), got };
    }

    if (dayNumber === 25) {
      const EventEmitter = new Function(`${code}; return EventEmitter;`)() as () => any;
      const emitter = EventEmitter();
      const results: number[] = [];
      const { event, emits, removeAfterFirst } = testCase.input as {
        event: string;
        emits: number[][];
        removeAfterFirst: boolean;
      };
      const listener = (a: number, b: number) => results.push(a + b);
      emitter.on(event, listener);
      emits.forEach((args, idx) => {
        emitter.emit(event, ...args);
        if (removeAfterFirst && idx === 0) emitter.off(event, listener);
      });
      return { passed: isEqual(results, testCase.expected), got: results };
    }

    if (dayNumber === 27) {
      const fns = new Function(`${code}; return { buildTrie, search };`)() as {
        buildTrie: (words: string[]) => unknown;
        search: (trie: unknown, prefix: string) => string[];
      };
      const { words, prefix } = testCase.input as { words: string[]; prefix: string };
      const trie = fns.buildTrie(words);
      const got = fns.search(trie, prefix);
      return { passed: isEqual(got, testCase.expected), got };
    }

    if (dayNumber === 28) {
      const rateLimiter = new Function(`${code}; return rateLimiter;`)() as (
        limit: number,
        windowMs: number
      ) => (id: string) => boolean;
      const { limit, windowMs, ids } = testCase.input as {
        limit: number;
        windowMs: number;
        ids: string[];
      };
      const allow = rateLimiter(limit, windowMs);
      const got = ids.map((id) => allow(id));
      return { passed: isEqual(got, testCase.expected), got };
    }

    const fn = new Function(`${code}\nreturn ${functionName};`)();
    const args = Array.isArray(testCase.input) ? testCase.input : [testCase.input];
    const result = fn(...args);
    const passed = isEqual(result, testCase.expected);
    return { passed, got: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown test error";
    return { passed: false, got: `Error: ${message}` };
  }
}

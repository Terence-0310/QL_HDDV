type BenchmarkTarget = {
  name: string;
  path: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
};

type Stats = {
  p50: number;
  p95: number;
  average: number;
  min: number;
  max: number;
  failures: number;
};

const DEFAULT_BASE_URL = process.env.PERF_BASE_URL ?? "http://localhost:3000";
const DEFAULT_ITERATIONS = Number(process.env.PERF_ITERATIONS ?? "10");
const AUTH_COOKIE = process.env.PERF_AUTH_COOKIE ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

const TARGETS: BenchmarkTarget[] = [
  { name: "dashboard", path: "/api/dashboard" },
  { name: "admin-summary", path: "/api/admin/reports/summary" },
  { name: "admin-contracts", path: "/api/admin/contracts?page=1&pageSize=10" },
  {
    name: "reminder-run",
    path: "/api/reminders/run",
    method: "POST",
    body: { limit: 20 },
  },
];

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(index, 0)];
}

function computeStats(samples: number[], failures: number): Stats {
  if (!samples.length) {
    return { p50: 0, p95: 0, average: 0, min: 0, max: 0, failures };
  }

  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    average: total / samples.length,
    min: Math.min(...samples),
    max: Math.max(...samples),
    failures,
  };
}

async function runTarget(target: BenchmarkTarget, iterations: number): Promise<Stats> {
  const samples: number[] = [];
  let failures = 0;

  for (let i = 0; i < iterations; i += 1) {
    const startedAt = performance.now();
    try {
      const response = await fetch(`${DEFAULT_BASE_URL}${target.path}`, {
        method: target.method ?? "GET",
        headers: {
          "content-type": "application/json",
          ...(AUTH_COOKIE ? { cookie: AUTH_COOKIE } : {}),
          ...(target.path === "/api/reminders/run" && CRON_SECRET ? { "x-cron-secret": CRON_SECRET } : {}),
        },
        body: target.body ? JSON.stringify(target.body) : undefined,
      });

      if (!response.ok) {
        failures += 1;
        continue;
      }

      samples.push(performance.now() - startedAt);
    } catch {
      failures += 1;
    }
  }

  return computeStats(samples, failures);
}

async function main() {
  const results: Record<string, Stats> = {};
  for (const target of TARGETS) {
    results[target.name] = await runTarget(target, DEFAULT_ITERATIONS);
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        baseUrl: DEFAULT_BASE_URL,
        iterations: DEFAULT_ITERATIONS,
        executedAt: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
  );
}

void main();

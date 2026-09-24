#!/usr/bin/env node
/**
 * Load test — not a stress/DoS tool. A handful of concurrent workers make
 * real HTTP requests for a fixed, short window and report latency and
 * error-rate stats, the same shape of thing a burst of real dinner-rush
 * traffic would produce. It deliberately:
 *
 *  - caps concurrency and duration (see MAX_* below) so a typo can't turn
 *    it into a flood,
 *  - refuses to run against a non-localhost target unless you pass
 *    --i-understand-the-risk, after printing why that matters (Vercel
 *    bills per invocation, Supabase caps concurrent connections, and most
 *    hosts' ToS want load tests coordinated with them beforehand),
 *  - never touches state-changing endpoints on its own — you choose the
 *    paths, and read-only GETs are the sane default.
 *
 * Usage:
 *   node scripts/load-test.mjs --url http://localhost:3000
 *   node scripts/load-test.mjs --url http://localhost:3000 \
 *       --paths /,/orders --concurrency 15 --duration 20
 *
 *   # against production — only once you've read the warning:
 *   node scripts/load-test.mjs --url https://your-site.vercel.app \
 *       --concurrency 5 --duration 15 --i-understand-the-risk
 */

const MAX_CONCURRENCY = 50;
const MAX_DURATION_S = 120;

function parseArgs(argv) {
  const out = {
    url: null,
    paths: ["/"],
    concurrency: 10,
    duration: 20,
    rps: null, // optional soft cap on requests/sec per worker, unthrottled if unset
    confirmed: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") out.url = argv[++i];
    else if (a === "--paths") out.paths = argv[++i].split(",").map((p) => p.trim());
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
    else if (a === "--duration") out.duration = Number(argv[++i]);
    else if (a === "--rps") out.rps = Number(argv[++i]);
    else if (a === "--i-understand-the-risk") out.confirmed = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`
Load test for this app's own HTTP endpoints.

  --url <base>            required, e.g. http://localhost:3000
  --paths <a,b,c>         comma-separated paths to rotate through (default: /)
  --concurrency <n>       parallel workers (default 10, max ${MAX_CONCURRENCY})
  --duration <seconds>    how long to run (default 20, max ${MAX_DURATION_S})
  --rps <n>               optional per-worker requests/sec cap (default: unthrottled)
  --i-understand-the-risk required to target anything but localhost/127.0.0.1
`);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function worker(id, baseUrl, paths, deadline, rps, stats) {
  const minGapMs = rps ? 1000 / rps : 0;
  let i = id;
  while (Date.now() < deadline) {
    const path = paths[i % paths.length];
    i++;
    const started = Date.now();
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        // This app's own middleware already refuses to cache API/admin
        // responses (see middleware.js); this just keeps the test's own
        // client from short-circuiting a request with a local cache hit.
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      // Draining the body matters: an unread stream can leave the
      // connection half-open and understate real latency.
      await res.arrayBuffer();
      stats.latencies.push(Date.now() - started);
      stats.statusCounts[res.status] = (stats.statusCounts[res.status] || 0) + 1;
      if (!res.ok) stats.errors++;
    } catch (e) {
      stats.latencies.push(Date.now() - started);
      stats.networkErrors++;
      stats.errorSamples.push(String(e.message || e).slice(0, 120));
    }
    stats.total++;

    if (minGapMs) {
      const elapsed = Date.now() - started;
      if (elapsed < minGapMs) await new Promise((r) => setTimeout(r, minGapMs - elapsed));
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const target = new URL(args.url);
  const isLocal = target.hostname === "localhost" || target.hostname === "127.0.0.1";
  if (!isLocal && !args.confirmed) {
    console.error(`
Refusing to run against ${target.hostname} without --i-understand-the-risk.

Before you add that flag, know that:
  - Vercel bills per serverless invocation — a load test is real traffic,
    real cost, not simulated.
  - Supabase caps concurrent database connections; too much concurrency
    here can starve real visitors browsing the site at the same time.
  - Most hosts' terms of service expect load/stress tests to be
    coordinated with them in advance, not run unannounced.

Test against a local build first (npm run build && npm run start, then
--url http://localhost:3000) to validate the app's own logic under load
without any of the above risk.
`);
    process.exit(1);
  }

  const concurrency = Math.max(1, Math.min(MAX_CONCURRENCY, Math.floor(args.concurrency) || 1));
  const duration = Math.max(1, Math.min(MAX_DURATION_S, Math.floor(args.duration) || 1));
  if (args.concurrency > MAX_CONCURRENCY) {
    console.log(`Note: concurrency capped at ${MAX_CONCURRENCY} (you asked for ${args.concurrency}).`);
  }
  if (args.duration > MAX_DURATION_S) {
    console.log(`Note: duration capped at ${MAX_DURATION_S}s (you asked for ${args.duration}).`);
  }

  console.log(
    `\nLoad test: ${target.origin} | paths: ${args.paths.join(", ")} | concurrency: ${concurrency} | duration: ${duration}s${
      args.rps ? ` | cap: ${args.rps} req/s/worker` : ""
    }\n`
  );

  const stats = {
    total: 0,
    errors: 0,
    networkErrors: 0,
    statusCounts: {},
    latencies: [],
    errorSamples: [],
  };

  const start = Date.now();
  const deadline = start + duration * 1000;
  const workers = Array.from({ length: concurrency }, (_, i) =>
    worker(i, target.origin, args.paths, deadline, args.rps, stats)
  );

  const progress = setInterval(() => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    process.stdout.write(`\r  ${elapsed}s / ${duration}s — ${stats.total} requests so far`);
  }, 1000);

  await Promise.all(workers);
  clearInterval(progress);
  process.stdout.write("\n\n");

  const elapsedS = (Date.now() - start) / 1000;
  const sorted = [...stats.latencies].sort((a, b) => a - b);
  const rps = stats.total / elapsedS;

  console.log("Results");
  console.log("-------");
  console.log(`Requests:        ${stats.total}`);
  console.log(`Duration:        ${elapsedS.toFixed(1)}s`);
  console.log(`Throughput:      ${rps.toFixed(1)} req/s`);
  console.log(
    `Errors:          ${stats.errors} HTTP + ${stats.networkErrors} network (${(
      ((stats.errors + stats.networkErrors) / Math.max(1, stats.total)) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`Status codes:    ${JSON.stringify(stats.statusCounts)}`);
  console.log("Latency (ms):");
  console.log(`  p50: ${percentile(sorted, 50)}`);
  console.log(`  p90: ${percentile(sorted, 90)}`);
  console.log(`  p99: ${percentile(sorted, 99)}`);
  console.log(`  max: ${sorted[sorted.length - 1] || 0}`);
  if (stats.errorSamples.length) {
    console.log("\nSample network errors:");
    for (const s of [...new Set(stats.errorSamples)].slice(0, 5)) console.log(`  - ${s}`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

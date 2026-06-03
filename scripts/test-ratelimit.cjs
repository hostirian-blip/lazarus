/* Logic check for the fixed-window rate limiter. Mirrors src/lib/ratelimit.ts.
 *   node scripts/test-ratelimit.cjs
 */
const hits = new Map();
let NOW = 1_000_000;
function rateLimit(key, limit, windowMs) {
  const e = hits.get(key);
  if (!e || e.resetAt < NOW) {
    hits.set(key, { count: 1, resetAt: NOW + windowMs });
    return true;
  }
  if (e.count >= limit) return false;
  e.count++;
  return true;
}

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

chk("1st allowed", rateLimit("k", 3, 1000) === true);
chk("2nd allowed", rateLimit("k", 3, 1000) === true);
chk("3rd allowed", rateLimit("k", 3, 1000) === true);
chk("4th blocked", rateLimit("k", 3, 1000) === false);
chk("other key allowed", rateLimit("k2", 3, 1000) === true);
NOW += 1001; // window elapses
chk("allowed again after window", rateLimit("k", 3, 1000) === true);

console.log(`ratelimit logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

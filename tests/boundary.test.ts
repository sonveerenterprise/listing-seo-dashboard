// Boundary guard: this repository is the dashboard only. Every module any source file loads (static import, export
// from, side-effect import, dynamic import(), require()) must be a file in src/ or an allowed package. A dynamic
// import or require with a non-literal argument fails, because it can't be checked.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = join(import.meta.dirname, "..");
const src = join(root, "src");
const rel = (f: string) => relative(src, f).split(sep).join("/");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
const files = walk(src);

const PACKAGES = /^(react|react-dom|next|next\/[a-z/-]+|zod|node:[a-z]+)$/;
const NON_LITERAL = "<non-literal dynamic import/require>";
function importsOf(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/(?:import|export)(?:\s+type)?[^"';()]*?from\s+["']([^"']+)["']|(?:^|[;\s])import\s+["']([^"']+)["']/g)) out.push(m[1] ?? m[2]);
  for (const m of source.matchAll(/\b(?:import|require)\s*\(\s*([^)]*?)\s*\)/g)) {
    const lit = /^(["'`])([^"'`$]+)\1$/.exec(m[1]);
    out.push(lit ? lit[2] : NON_LITERAL);
  }
  return out;
}
function resolveLocal(fromFile: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(src, spec.slice(2)) : resolve(dirname(fromFile), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}

test("every import resolves to a file in src/ or an allowed package", () => {
  const bad: string[] = [];
  for (const f of files) {
    for (const spec of importsOf(readFileSync(f, "utf8"))) {
      if (spec.endsWith(".css")) continue;
      if (spec === NON_LITERAL) bad.push(`${rel(f)} → ${spec}`);
      else if (spec.startsWith("@/") || spec.startsWith(".")) {
        if (!resolveLocal(f, spec)) bad.push(`${rel(f)} → ${spec} (not in src/)`);
      } else if (!PACKAGES.test(spec)) bad.push(`${rel(f)} → package ${spec}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("the scanner sees dynamic imports and require", () => {
  assert.deepEqual(importsOf('const a = await import("@/x"); const b = require("y"); const c = await import(v);'), ["@/x", "y", NON_LITERAL]);
});

test("no database, AI or payment SDK is a dependency", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  for (const d of deps) assert.ok(!/prisma|anthropic|openai|razorpay|next-auth|@auth\/|pg$|postgres/.test(d), d);
});

test("public wording: no claims that the service code is freely available or can be run elsewhere", () => {
  const bad = files.filter((f) => /open[ -]?source|self[ -]?host|MIT[ -]licen[cs]ed|under the MIT/i.test(readFileSync(f, "utf8")));
  assert.deepEqual(bad.map(rel), []);
});

test("lockfile present, in step with package.json, every package from the npm registry with an integrity hash", () => {
  assert.ok(existsSync(join(root, "package-lock.json")), "package-lock.json missing — CI runs `npm ci`");
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.deepEqual(lock.packages[""].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[""].devDependencies, pkg.devDependencies);
  for (const [k, v] of Object.entries(lock.packages as Record<string, { resolved?: string; integrity?: string }>)) {
    if (!k) continue;
    assert.ok(v.resolved?.startsWith("https://registry.npmjs.org/") && v.integrity?.startsWith("sha512-"), k);
  }
});

test("CI actions are pinned to full commit SHAs and the workflow has read-only permissions", () => {
  const ci = readFileSync(join(root, ".github", "workflows", "ci.yml"), "utf8");
  const uses = [...ci.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
  assert.ok(uses.length >= 2);
  for (const u of uses) assert.match(u, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, u);
  assert.match(ci, /permissions:\s*\n\s*contents:\s*read/);
  assert.ok(!/pull_request_target|secrets\./.test(ci));
  assert.ok(existsSync(join(root, ".github", "dependabot.yml")), "dependabot config missing");
});

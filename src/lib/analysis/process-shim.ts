// Standalone module with no imports of its own, so ES module evaluation
// order guarantees this runs before any module that imports it — including
// ones imported afterward in the same file. See worker.ts for why this is
// needed: @babel/parser/@babel/traverse read `process.env.NODE_ENV` at
// their own module top level, before our code ever runs, so the shim must
// be the very first thing evaluated in the worker's module graph.
if (typeof (globalThis as unknown as { process?: unknown }).process === "undefined") {
    (globalThis as unknown as { process: { env: Record<string, string> } }).process = { env: { NODE_ENV: "production" } };
}
export {};

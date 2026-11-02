// Runs FinPilot's built-in test suites headlessly in Node:  npm test
// Covers Phases 3-12 and the cross-module consistency suite. The Phase 2 (Invoice Intelligence) tests
// are a React component, so they run inside the app, not here.
// The browser's localStorage is replaced by an in-memory version.
const store: Record<string, string> = {};
const api: any = {
  getItem: (k: string) => (k in store ? store[k] : null), setItem: (k: string, v: string) => { store[k] = String(v); },
  removeItem: (k: string) => { delete store[k]; }, clear: () => { for (const k in store) delete store[k]; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
// Proxy so Object.keys(localStorage) lists stored keys, like a browser.
(globalThis as any).localStorage = new Proxy(store, {
  get: (t, p: any) => (p === "length" ? Object.keys(t).length : p in api ? api[p] : t[p]),
  set: (t, p: any, v) => { t[p] = String(v); return true; },
  ownKeys: (t) => Reflect.ownKeys(t), getOwnPropertyDescriptor: (t, p) => Reflect.getOwnPropertyDescriptor(t, p),
});
const root = process.argv[2] ?? process.cwd();
const suites: [string, string, string][] = [
  ["Phase 3", "phase3TestSuite", "runPhase3TestSuite"], ["Phase 4", "phase4TestSuite", "runPhase4TestSuite"],
  ["Phase 5", "phase5TestSuite", "runPhase5TestSuite"], ["Phase 6", "phase6TestSuite", "runPhase6TestSuite"],
  ["Phase 7", "phase7TestSuite", "runPhase7TestSuite"], ["Phase 8", "phase8TestSuite", "runPhase8TestSuite"],
  ["Phase 9", "phase9TestSuite", "runPhase9TestSuite"], ["Phase 10", "phase10TestSuite", "runPhase10TestSuite"],
  ["Phase 11", "phase11TestSuite", "runPhase11TestSuite"], ["Phase 12", "phase12TestSuite", "runPhase12TestSuite"],
  ["Cross-module", "crossModuleConsistencyTestSuite", "runCrossModuleConsistencyTestSuite"],
];
const isPass = (r: any) => r.passed === true || r.pass === true || r.status === "PASS" || r.status === "pass" || r.status === "passed" || r.status === "Passed" || r.result === "PASS";
(async () => {
  let T = 0, P = 0, errors = 0;
  for (const [name, file, fn] of suites) {
    try {
      const mod = await import(`${root}/src/services/${file}.ts`);
      const out = await mod[fn]();
      const list: any[] = Array.isArray(out) ? out : (out.results ?? out.testResults ?? out.tests ?? []);
      const passed = list.filter(isPass).length;
      T += list.length; P += passed;
      const failed = list.filter((r) => !isPass(r)).map((r) => r.name ?? r.testName ?? r.id ?? JSON.stringify(r).slice(0, 80));
      console.log(`${name.padEnd(13)} ${String(passed).padStart(3)}/${String(list.length).padEnd(3)} ${failed.length ? "FAILED: " + failed.slice(0, 5).join(" | ") : ""}`);
    } catch (e: any) { errors++; console.log(`${name.padEnd(13)} ERROR ${e?.message?.slice(0, 200)}`); }
  }
  console.log(`TOTAL         ${P}/${T}${errors ? `  (${errors} suite(s) could not run)` : ""}`);
  process.exitCode = P === T && T > 0 && errors === 0 ? 0 : 1;
})();

/* Writes every bench setting the widget offers, computed by assets/pai-live.js, as JSON.
   Usage: node materials/pai_canon.js <repo> <out.json>   (by Phoebe Fu) */
var path = require("path"), fs = require("fs");
var repo = process.argv[2] || ".", out = process.argv[3];
var P = require(path.resolve(repo, "assets/pai-live.js"));
function slim(L) {
  function r(x) { return { id: x.id, beta: x.beta, sim: x.sim, truth: x.truth, gap: x.gap, k: x.real.k, n: x.real.n, lo: x.real.ci.lo, hi: x.real.ci.hi, dim: x.real.dim, normal: x.real.normal, centre: x.real.centre, edge: x.real.edge }; }
  return { rungs: L.rungs.map(r), anti: r(L.anti), brk: { k: L.brk.real.k, n: L.brk.real.n, lo: L.brk.real.ci.lo, hi: L.brk.real.ci.hi, truth: L.brk.truth }, fisherTopVsNone: L.fisherTopVsNone };
}
var res = { generated: "2026-11-22", defaults: P.DEFAULTS, world: P.WORLD, selfTest: P.selfTest(), faults: {}, settings: {} };
P.FAULTS.forEach(function (f) { res.faults[f] = P.selfTest(f).pass; });
[1122, 1, 7, 42].forEach(function (seed) {
  [20, 50, 200].forEach(function (n) { res.settings[seed + "_" + n] = slim(P.ladder({ seed: seed, nTrials: n })); });
});
res.extras = { wilson_18_20: P.wilson(18, 20), wilson_15_20: P.wilson(15, 20), wilson_0_20: P.wilson(0, 20), wilson_20_20: P.wilson(20, 20), fisher_18_15: P.fisher(18, 20, 15, 20), fisher_18_5: P.fisher(18, 20, 5, 20) };
var s = JSON.stringify(res, null, 1);
if (out) fs.writeFileSync(out, s); else console.log(s);

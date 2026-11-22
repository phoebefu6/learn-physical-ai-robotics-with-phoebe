/* pai-live.js - the computed engine for learn-physical-ai-robotics-with-phoebe, by Phoebe Fu.
   One file for node and the browser. Python mirror: materials/pai_reference.py (must agree).

   EVERYTHING HERE IS SYNTHETIC AND CONSTRUCTED. Wrenfield Lab is a fictional robotics team teaching a
   two-arm robot to pick parcels. The "world" is a seeded generator: an object lies somewhere on a table,
   a camera sees it through lighting and its own mounting pose, and a tiny linear grasp policy predicts
   where to close the gripper. A grasp succeeds when the prediction lands within 1.0 cm of the object.
   The maths is real: closed-form ridge regression, the Wilson (1927) score interval, Fisher's exact test.

   How the constructed world is wired (each line is a modelling choice, declared on the widget):
   - object position x ~ U(-10, 10) cm along the table
   - camera mounting offset: in sim U(-wC, wC); on the real robot N(0.2, 0.7) cm (re-mounted per shift)
   - lighting: in sim 1 + U(-wL, wL); real cell U(0.6, 1.1) (a dimmer room than the simulator's default)
   - lighting bias on the seen position: 5 d + 5 d^2 cm with d = light - 1; noise sd 0.2 + 1.0 d^2
   - the real lens magnifies by 1.08 (the simulator renders 1.00): an error only real data can reveal
   - the policy sees u (object image position), e (a table-edge fiducial, which moves with the camera)
     and g (measured brightness), and predicts x = b0 + b1 u + b2 e + b3 g
   Ladder: no randomization -> lighting randomized -> + camera pose randomized -> + 20 real
   demonstrations (weight 5) -> scorecard (Wilson 95% on N real trials, sim-vs-real gap, per condition).
   Anti-lever: over-randomize (lighting +-0.95, camera +-12 cm): sim AND real success fall.
   Break button: the real camera is bumped 2 cm after calibration and nothing in the inputs records it.
   selfTest() runs on load; each check is proven to fail on a planted fault (FAULTS).
*/
(function (root) {
  "use strict";

  var FAULT = null; // set only inside selfTest to prove a check can fail
  var Z95 = 1.959963984540054;

  var WORLD = {
    tol: 1.0, xHalf: 10, camRealMean: 0.2, camRealSd: 0.7, lightLo: 0.6, lightHi: 1.1,
    biasA: 5.0, biasB: 5.0, sd0: 0.2, sd1: 1.0, lens: 1.08, eSd: 0.15, gSd: 0.03,
    bumpCm: 2.0, dimBelow: 0.85, edgeBeyond: 5.0
  };

  var DEFAULTS = { seed: 1122, nSim: 400, nTrials: 50, nTruth: 2000, nSimEval: 1000, nDemos: 20, demoWeight: 5, lambda: 0.001 };

  var RUNGS = [
    { id: "none", label: "No randomization", wL: 0, wC: 0, demos: false },
    { id: "light", label: "Lighting randomized", wL: 0.4, wC: 0, demos: false },
    { id: "cam", label: "+ camera pose randomized", wL: 0.4, wC: 3, demos: false },
    { id: "demos", label: "+ 20 real demonstrations", wL: 0.4, wC: 3, demos: true }
  ];
  var ANTI = { id: "over", label: "Over-randomized", wL: 0.95, wC: 12, demos: false };

  function extend(a, b) {
    var o = {}, k;
    for (k in a) o[k] = a[k];
    if (b) for (k in b) o[k] = b[k];
    return o;
  }

  function mulberry32(seed) {
    var a = seed | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(rnd) { // Box-Muller, two draws per call, no caching
    var u1 = rnd(), u2 = rnd();
    return Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2);
  }

  // One episode. Draw order is fixed: x, camera, light, image noise, fiducial noise, brightness noise.
  function episode(rnd, w, real, bump) {
    var x = (2 * rnd() - 1) * WORLD.xHalf;
    var cam = real ? WORLD.camRealMean + WORLD.camRealSd * normal(rnd) : (2 * rnd() - 1) * w.wC;
    var light = real ? WORLD.lightLo + (WORLD.lightHi - WORLD.lightLo) * rnd() : 1 + (2 * rnd() - 1) * w.wL;
    var d = light - 1;
    var bias = WORLD.biasA * d + WORLD.biasB * d * d;
    var sd = WORLD.sd0 + WORLD.sd1 * d * d;
    var lens = real ? WORLD.lens : 1.0;
    var camInU = (FAULT === "simCamIgnored" && !real) ? 0 : cam;
    var u = lens * x + camInU + bias + sd * normal(rnd);
    var e = cam + WORLD.eSd * normal(rnd);
    var g = light + WORLD.gSd * normal(rnd);
    if (bump) {
      u += WORLD.bumpCm;                       // the camera moved; the image moved with it
      if (FAULT === "bumpModelled") e += WORLD.bumpCm; // planted fault: pretend the fiducial saw it
    }
    return { x: x, u: u, e: e, g: g, light: light };
  }

  function dataset(seed, n, w, real, bump) {
    var rnd = mulberry32(seed), out = [];
    for (var i = 0; i < n; i++) out.push(episode(rnd, w, real, bump));
    return out;
  }

  // Gaussian elimination with partial pivoting on a small square system.
  function solve(A, b) {
    var n = b.length, M = [], i, j, k;
    for (i = 0; i < n; i++) { M.push(A[i].slice()); M[i].push(b[i]); }
    for (k = 0; k < n; k++) {
      var p = k;
      for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      var tmp = M[k]; M[k] = M[p]; M[p] = tmp;
      for (i = k + 1; i < n; i++) {
        var f = M[i][k] / M[k][k];
        for (j = k; j <= n; j++) M[i][j] -= f * M[k][j];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  }

  function feats(ep) { return [1, ep.u, ep.e, ep.g]; }

  // Weighted ridge: (X'WX + lambda I) b = X'W y. sets = [{rows, weight}]
  function fit(sets, lambda) {
    var A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], b = [0, 0, 0, 0], i, j;
    sets.forEach(function (s) {
      s.rows.forEach(function (ep) {
        var f = feats(ep);
        for (i = 0; i < 4; i++) {
          b[i] += s.weight * f[i] * ep.x;
          for (j = 0; j < 4; j++) A[i][j] += s.weight * f[i] * f[j];
        }
      });
    });
    for (i = 0; i < 4; i++) A[i][i] += lambda;
    if (FAULT === "ridgeTranspose") { var t = A[0][1]; A[0][1] = A[1][0] + 1; A[1][0] = t; }
    return solve(A, b);
  }

  function predict(beta, ep) { return beta[0] + beta[1] * ep.u + beta[2] * ep.e + beta[3] * ep.g; }
  function hit(beta, ep) { return Math.abs(predict(beta, ep) - ep.x) < WORLD.tol; }

  function wilson(k, n, z) {
    z = z || Z95;
    if (n === 0) return { p: 0, lo: 0, hi: 1 };
    var p = k / n;
    if (FAULT === "wilsonWald") {
      var hw = z * Math.sqrt(p * (1 - p) / n);
      return { p: p, lo: Math.max(0, p - hw), hi: Math.min(1, p + hw) };
    }
    var z2 = z * z, den = 1 + z2 / n;
    var centre = (p + z2 / (2 * n)) / den;
    var half = (z / den) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return { p: p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
  }

  function lchoose(n, k) { var s = 0; for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; }

  // Fisher's exact test, two-sided: sum of tables no more likely than the observed one.
  function fisher(a, n1, b, n2) {
    var K = a + b, N = n1 + n2, lo = Math.max(0, K - n2), hi = Math.min(K, n1);
    var base = lchoose(N, K), obs = Math.exp(lchoose(n1, a) + lchoose(n2, K - a) - base), p = 0;
    if (FAULT === "fisherPointOnly") return obs;
    for (var x = lo; x <= hi; x++) {
      var px = Math.exp(lchoose(n1, x) + lchoose(n2, K - x) - base);
      if (px <= obs * (1 + 1e-7)) p += px;
    }
    return Math.min(1, p);
  }

  function score(beta, rows) {
    var k = 0, dim = [0, 0], norm = [0, 0], centre = [0, 0], edge = [0, 0];
    rows.forEach(function (ep) {
      var h = hit(beta, ep) ? 1 : 0;
      k += h;
      var L = ep.light < WORLD.dimBelow ? dim : norm; L[0] += h; L[1] += 1;
      var P = Math.abs(ep.x) > WORLD.edgeBeyond ? edge : centre; P[0] += h; P[1] += 1;
    });
    return { k: k, n: rows.length, rate: k / rows.length, ci: wilson(k, rows.length), dim: dim, normal: norm, centre: centre, edge: edge };
  }

  // Streams: every rung shares the same underlying draws (common random numbers), only widths differ.
  function streams(o) {
    return { sim: o.seed * 7 + 1, simEval: o.seed * 7 + 2, demos: o.seed * 7 + 3, trials: o.seed * 7 + 4, truth: o.seed * 7 + 5 };
  }

  function runRung(r, o, real, truth, demoRows, st) {
    var sim = dataset(st.sim, o.nSim, r, false, false);
    var sets = [{ rows: sim, weight: 1 }];
    if (r.demos) sets.push({ rows: demoRows, weight: o.demoWeight });
    var beta = fit(sets, o.lambda);
    var simEval = score(beta, dataset(st.simEval, o.nSimEval, r, false, false));
    var realS = score(beta, real);
    var truthS = score(beta, truth);
    return {
      id: r.id, label: r.label, wL: r.wL, wC: r.wC, demos: r.demos, beta: beta,
      sim: simEval.rate, real: realS, truth: truthS.rate, gap: simEval.rate - realS.rate
    };
  }

  function ladder(opts) {
    var o = extend(DEFAULTS, opts), st = streams(o);
    var real = dataset(st.trials, o.nTrials, null, true, false);
    var truth = dataset(st.truth, o.nTruth, null, true, false);
    var demoRows = dataset(st.demos, o.nDemos, null, true, false);
    var rungs = RUNGS.map(function (r) { return runRung(r, o, real, truth, demoRows, st); });
    var top = rungs[rungs.length - 1];
    var anti = runRung(ANTI, o, real, truth, demoRows, st);
    var bumped = dataset(st.trials, o.nTrials, null, true, true);
    var bumpedTruth = dataset(st.truth, o.nTruth, null, true, true);
    var brk = { real: score(top.beta, bumped), truth: score(top.beta, bumpedTruth).rate, cm: WORLD.bumpCm };
    var cmp = fisher(top.real.k, top.real.n, rungs[0].real.k, rungs[0].real.n);
    return { opts: o, rungs: rungs, top: top, anti: anti, brk: brk, fisherTopVsNone: cmp };
  }

  // A rung with the reader's own widths, on the same streams as the ladder (so rows are comparable).
  function custom(w, opts) {
    var o = extend(DEFAULTS, opts), st = streams(o);
    var real = dataset(st.trials, o.nTrials, null, true, false);
    var truth = dataset(st.truth, o.nTruth, null, true, false);
    var demoRows = dataset(st.demos, o.nDemos, null, true, false);
    var r = runRung({ id: "custom", label: "Your widths", wL: w.wL, wC: w.wC, demos: !!w.demos }, o, real, truth, demoRows, st);
    if (w.bump) {
      r.brk = { real: score(r.beta, dataset(st.trials, o.nTrials, null, true, true)), truth: score(r.beta, dataset(st.truth, o.nTruth, null, true, true)).rate };
    }
    return r;
  }

  // Each check is a property; selfTest(fault) re-runs them with a fault planted in the REAL code path.
  function selfTest(fault) {
    var prev = FAULT; FAULT = fault || null;
    var checks = [];
    try {
      var w0 = wilson(0, 20);
      checks.push({ name: "Wilson 0/20 runs from 0 to z^2/(n+z^2) = 0.1611, never the zero-width Wald interval",
        pass: w0.lo === 0 && Math.abs(w0.hi - (Z95 * Z95) / (20 + Z95 * Z95)) < 1e-12 });
      var rnd = mulberry32(5), rows = [];
      for (var i = 0; i < 60; i++) {
        var u = 20 * rnd() - 10, e = 4 * rnd() - 2, g = 0.6 + 0.8 * rnd();
        rows.push({ u: u, e: e, g: g, x: 0.5 + 1.1 * u - 0.9 * e + 2.0 * g });
      }
      var bt = fit([{ rows: rows, weight: 1 }], 0);
      checks.push({ name: "ridge with lambda 0 recovers known coefficients on noiseless rows",
        pass: Math.abs(bt[0] - 0.5) < 1e-6 && Math.abs(bt[1] - 1.1) < 1e-6 && Math.abs(bt[2] + 0.9) < 1e-6 && Math.abs(bt[3] - 2.0) < 1e-6 });
      var f1 = fisher(18, 20, 15, 20), f2 = fisher(18, 20, 5, 20);
      checks.push({ name: "Fisher exact two-sided: 18/20 vs 15/20 gives p = 0.4075 (not significant), 18/20 vs 5/20 is",
        pass: Math.abs(f1 - 0.40748440748440748) < 1e-9 && f2 < 0.05 });
      var L = ladder({ nTrials: 200 });
      checks.push({ name: "camera randomization teaches the policy to subtract the fiducial (b2 near -1)",
        pass: Math.abs(L.rungs[2].beta[2] + 1) < 0.15 });
      checks.push({ name: "an unrecorded 2 cm camera bump collapses real success by more than 40 points",
        pass: L.brk.real.rate < L.top.real.rate - 0.4 });
    } catch (err) {
      checks.push({ name: "engine threw: " + String(err), pass: false });
    }
    FAULT = prev;
    var pass = checks.every(function (c) { return c.pass; });
    return { pass: pass, checks: checks, fault: fault || null };
  }

  var PAI = {
    WORLD: WORLD, DEFAULTS: DEFAULTS, RUNGS: RUNGS, ANTI: ANTI,
    mulberry32: mulberry32, dataset: dataset, fit: fit, wilson: wilson, fisher: fisher, score: score, ladder: ladder, custom: custom,
    selfTest: selfTest, FAULTS: ["wilsonWald", "ridgeTranspose", "fisherPointOnly", "simCamIgnored", "bumpModelled"]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = PAI;
  if (root) {
    root.PAI = PAI;
    try {
      PAI.selfTestResult = selfTest();
      if (!PAI.selfTestResult.pass && root.console) root.console.error("pai-live selfTest failed", PAI.selfTestResult);
    } catch (e) { PAI.selfTestResult = { pass: false, error: String(e) }; }
  }
})(typeof window !== "undefined" ? window : null);

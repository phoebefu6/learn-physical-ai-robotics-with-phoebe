"""Python reference for assets/pai-live.js: same constants, same seeded draws, same arithmetic order.

Usage:
  python3 -I pai_reference.py                         # print the canon ladder (seed 1122, 50 trials)
  python3 -I pai_reference.py --compare FILE          # compare by VALUE with node's canon JSON
                                                      # (node materials/pai_canon.js <repo> FILE)
  python3 -I pai_reference.py --compare FILE --plant 0.001
                                                      # proves the comparator fails a 0.1% fault
Agreement rule: every integer (successes, trials, per-condition counts) identical; every real number
within 1e-9 relative (or 1e-12 absolute near zero). Exit 1 on any disagreement.

Everything is synthetic: Wrenfield Lab and its robot are constructed. By Phoebe Fu.
"""
import json, math, sys

M32 = 0xFFFFFFFF
Z95 = 1.959963984540054
WORLD = dict(tol=1.0, xHalf=10, camRealMean=0.2, camRealSd=0.7, lightLo=0.6, lightHi=1.1,
             biasA=5.0, biasB=5.0, sd0=0.2, sd1=1.0, lens=1.08, eSd=0.15, gSd=0.03,
             bumpCm=2.0, dimBelow=0.85, edgeBeyond=5.0)
DEFAULTS = dict(seed=1122, nSim=400, nTrials=50, nTruth=2000, nSimEval=1000, nDemos=20, demoWeight=5, lam=0.001)
RUNGS = [dict(id="none", wL=0, wC=0, demos=False), dict(id="light", wL=0.4, wC=0, demos=False),
         dict(id="cam", wL=0.4, wC=3, demos=False), dict(id="demos", wL=0.4, wC=3, demos=True)]
ANTI = dict(id="over", wL=0.95, wC=12, demos=False)


def to_i32(x):
    x &= M32
    return x - (1 << 32) if x & 0x80000000 else x


def imul(a, b):
    return to_i32(a * b)


def mulberry32(seed):
    st = [to_i32(seed)]

    def rnd():
        a = to_i32(st[0] + 0x6D2B79F5)
        st[0] = a
        t = imul(a ^ ((a & M32) >> 15), 1 | a)
        t = to_i32(to_i32(t + imul(t ^ ((t & M32) >> 7), 61 | t)) ^ t)
        return ((t ^ ((t & M32) >> 14)) & M32) / 4294967296.0
    return rnd


def normal(rnd):
    u1 = rnd(); u2 = rnd()
    return math.sqrt(-2 * math.log(1 - u1)) * math.cos(2 * math.pi * u2)


def episode(rnd, w, real, bump):
    W = WORLD
    x = (2 * rnd() - 1) * W["xHalf"]
    cam = W["camRealMean"] + W["camRealSd"] * normal(rnd) if real else (2 * rnd() - 1) * w["wC"]
    light = W["lightLo"] + (W["lightHi"] - W["lightLo"]) * rnd() if real else 1 + (2 * rnd() - 1) * w["wL"]
    d = light - 1
    bias = W["biasA"] * d + W["biasB"] * d * d
    sd = W["sd0"] + W["sd1"] * d * d
    lens = W["lens"] if real else 1.0
    u = lens * x + cam + bias + sd * normal(rnd)
    e = cam + W["eSd"] * normal(rnd)
    g = light + W["gSd"] * normal(rnd)
    if bump:
        u += W["bumpCm"]
    return dict(x=x, u=u, e=e, g=g, light=light)


def dataset(seed, n, w, real, bump):
    rnd = mulberry32(seed)
    return [episode(rnd, w, real, bump) for _ in range(n)]


def solve(A, b):
    n = len(b)
    M = [A[i][:] + [b[i]] for i in range(n)]
    for k in range(n):
        p = k
        for i in range(k + 1, n):
            if abs(M[i][k]) > abs(M[p][k]):
                p = i
        M[k], M[p] = M[p], M[k]
        for i in range(k + 1, n):
            f = M[i][k] / M[k][k]
            for j in range(k, n + 1):
                M[i][j] -= f * M[k][j]
    x = [0.0] * n
    for i in range(n - 1, -1, -1):
        s = M[i][n]
        for j in range(i + 1, n):
            s -= M[i][j] * x[j]
        x[i] = s / M[i][i]
    return x


def fit(sets, lam):
    A = [[0.0] * 4 for _ in range(4)]
    b = [0.0] * 4
    for rows, weight in sets:
        for ep in rows:
            f = [1, ep["u"], ep["e"], ep["g"]]
            for i in range(4):
                b[i] += weight * f[i] * ep["x"]
                for j in range(4):
                    A[i][j] += weight * f[i] * f[j]
    for i in range(4):
        A[i][i] += lam
    return solve(A, b)


def hit(beta, ep):
    p = beta[0] + beta[1] * ep["u"] + beta[2] * ep["e"] + beta[3] * ep["g"]
    return abs(p - ep["x"]) < WORLD["tol"]


def wilson(k, n, z=Z95):
    if n == 0:
        return dict(p=0, lo=0, hi=1)
    p = k / n
    z2 = z * z
    den = 1 + z2 / n
    centre = (p + z2 / (2 * n)) / den
    half = (z / den) * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))
    return dict(p=p, lo=max(0, centre - half), hi=min(1, centre + half))


def lchoose(n, k):
    s = 0.0
    for i in range(1, k + 1):
        s += math.log(n - k + i) - math.log(i)
    return s


def fisher(a, n1, b, n2):
    K = a + b; N = n1 + n2
    lo = max(0, K - n2); hi = min(K, n1)
    base = lchoose(N, K)
    obs = math.exp(lchoose(n1, a) + lchoose(n2, K - a) - base)
    p = 0.0
    for x in range(lo, hi + 1):
        px = math.exp(lchoose(n1, x) + lchoose(n2, K - x) - base)
        if px <= obs * (1 + 1e-7):
            p += px
    return min(1, p)


def score(beta, rows):
    k = 0; dim = [0, 0]; nor = [0, 0]; centre = [0, 0]; edge = [0, 0]
    for ep in rows:
        h = 1 if hit(beta, ep) else 0
        k += h
        L = dim if ep["light"] < WORLD["dimBelow"] else nor
        L[0] += h; L[1] += 1
        P = edge if abs(ep["x"]) > WORLD["edgeBeyond"] else centre
        P[0] += h; P[1] += 1
    ci = wilson(k, len(rows))
    return dict(k=k, n=len(rows), rate=k / len(rows), lo=ci["lo"], hi=ci["hi"], dim=dim, normal=nor, centre=centre, edge=edge)


def ladder(seed=1122, nTrials=50):
    o = dict(DEFAULTS, seed=seed, nTrials=nTrials)
    st = dict(sim=seed * 7 + 1, simEval=seed * 7 + 2, demos=seed * 7 + 3, trials=seed * 7 + 4, truth=seed * 7 + 5)
    real = dataset(st["trials"], nTrials, None, True, False)
    truth = dataset(st["truth"], o["nTruth"], None, True, False)
    demo_rows = dataset(st["demos"], o["nDemos"], None, True, False)

    def run(r):
        sim = dataset(st["sim"], o["nSim"], r, False, False)
        sets = [(sim, 1)]
        if r["demos"]:
            sets.append((demo_rows, o["demoWeight"]))
        beta = fit(sets, o["lam"])
        sim_rate = score(beta, dataset(st["simEval"], o["nSimEval"], r, False, False))["rate"]
        rs = score(beta, real)
        tr = score(beta, truth)["rate"]
        return dict(id=r["id"], beta=beta, sim=sim_rate, truth=tr, gap=sim_rate - rs["rate"], k=rs["k"], n=rs["n"],
                    lo=rs["lo"], hi=rs["hi"], dim=rs["dim"], normal=rs["normal"], centre=rs["centre"], edge=rs["edge"])
    rungs = [run(r) for r in RUNGS]
    top = rungs[-1]
    anti = run(ANTI)
    b = score(top["beta"], dataset(st["trials"], nTrials, None, True, True))
    bt = score(top["beta"], dataset(st["truth"], o["nTruth"], None, True, True))["rate"]
    return dict(rungs=rungs, anti=anti, brk=dict(k=b["k"], n=b["n"], lo=b["lo"], hi=b["hi"], truth=bt),
                fisherTopVsNone=fisher(top["k"], top["n"], rungs[0]["k"], rungs[0]["n"]))


def all_settings():
    out = {}
    for seed in (1122, 1, 7, 42):
        for n in (20, 50, 200):
            out["%d_%d" % (seed, n)] = ladder(seed, n)
    extras = dict(wilson_18_20=wilson(18, 20), wilson_15_20=wilson(15, 20), wilson_0_20=wilson(0, 20),
                  wilson_20_20=wilson(20, 20), fisher_18_15=fisher(18, 20, 15, 20), fisher_18_5=fisher(18, 20, 5, 20))
    return out, extras


def compare(a, b, path, bad, plant):
    if isinstance(a, dict):
        for k in a:
            if k not in b:
                bad.append(path + "/" + k + " missing in node")
            else:
                compare(a[k], b[k], path + "/" + k, bad, plant)
    elif isinstance(a, list):
        if len(a) != len(b):
            bad.append(path + " length")
        for i, (x, y) in enumerate(zip(a, b)):
            compare(x, y, path + "[%d]" % i, bad, plant)
    elif isinstance(a, bool) or isinstance(a, str):
        if a != b:
            bad.append(path)
    elif isinstance(a, int) and isinstance(b, int):
        if a != b:
            bad.append("%s %s != %s" % (path, a, b))
    else:
        x = float(a) * (1 + plant); y = float(b)
        if abs(x - y) > max(1e-12, 1e-9 * max(abs(x), abs(y))):
            bad.append("%s %r != %r" % (path, x, y))
    return bad


def main(argv):
    if "--compare" in argv:
        f = argv[argv.index("--compare") + 1]
        plant = float(argv[argv.index("--plant") + 1]) if "--plant" in argv else 0.0
        node = json.load(open(f))
        py, extras = all_settings()
        bad = compare(py, node["settings"], "settings", [], plant)
        bad = compare(extras, node["extras"], "extras", bad, plant)
        n = sum(1 for _ in json.dumps(py).split(","))
        if bad:
            print("DISAGREE: %d values" % len(bad))
            for b in bad[:12]:
                print("  " + b)
            return 1
        print("AGREE: every setting (4 seeds x 3 trial counts) and every extra matches node, about %d fields" % n)
        return 0
    L = ladder()
    for r in L["rungs"] + [L["anti"]]:
        print("%-6s sim %.3f real %d/%d [%.3f, %.3f] truth %.3f gap %+.3f beta %s" % (
            r["id"], r["sim"], r["k"], r["n"], r["lo"], r["hi"], r["truth"], r["gap"], ", ".join("%.3f" % v for v in r["beta"])))
    print("break  real %d/%d [%.3f, %.3f] truth %.3f" % (L["brk"]["k"], L["brk"]["n"], L["brk"]["lo"], L["brk"]["hi"], L["brk"]["truth"]))
    print("Fisher two-sided, top rung vs no randomization: p = %.6f" % L["fisherTopVsNone"])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

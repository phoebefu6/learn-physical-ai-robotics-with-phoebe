# Agent brief - shared by every fan-out page of learn-physical-ai-robotics-with-phoebe

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page for YOUR track. Copy its structure, classes, SVG grammar, widget markup and quiz
   markup EXACTLY, including 3 options per question:
   - Leader track: `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-physical-ai-robotics-with-phoebe/courses/a1-the-robot-is-a-data-loop.html`
   - Practitioner track: `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-physical-ai-robotics-with-phoebe/courses/p1-anatomy-of-an-episode.html`
   - The bench page (how a page uses the engine): `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-physical-ai-robotics-with-phoebe/courses/p10-the-sim-to-real-bench.html`
2. The source map: every verified number, its evidence tier, per-session coverage, the seams, the bench
   canon and the width grid. Use ONLY its numbers; never invent a statistic; if a fact is missing, teach
   the uncertainty.
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-physical-ai-robotics-with-phoebe/materials/official-course-map.md`
3. The stylesheet `:root` block for the palette tokens (first 30 lines):
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-physical-ai-robotics-with-phoebe/assets/style.css`
4. If your page uses the engine: `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-physical-ai-robotics-with-phoebe/assets/pai-live.js`
   (API: `PAI.wilson(k, n)` -> {p, lo, hi}; `PAI.fisher(a, n1, b, n2)` -> two-sided p;
   `PAI.ladder({seed, nTrials})`; `PAI.custom({wL, wC, demos}, {seed, nTrials})`; `PAI.selfTestResult`).
   Load it with `<script src="../assets/pai-live.js?v=1"></script>` BEFORE app.js.

## Page skeleton (keep every component, in the template's order)

toolbar (crumb EXACTLY "learn-physical-ai-robotics-with-phoebe / Leader session N of 6" or
"/ Practitioner session N of 10", linked as in the template, #toggle-all, #zoom-toggle) · masthead
(eyebrow "Learn Physical AI &amp; Robotics with Phoebe · Leader session N of 6" or "· Practitioner session
N of 10", h1 with one `<span class="accent">`, .sub, .chip-row with the level chip (🟢 Foundations,
🟡 Working depth, 🟠 Advanced, matching the card colour on the landing page), two audience chips and the
time chip, .agenda a1-a4) · main.wrap · section#intro (Part 0: kicker, .lede, .legend pills,
.callout.win "★ What you walk out with tonight.", one open details.card with a `.callout.example`
"Real world", one self-study card) · 3 Parts, each `section.section#part-N` with section-kicker (klabel
"Part N · covers ...", h2, `.tag.concept "N min live"`), a `.lede`, ONE figure, `details.card`
accordions (summary: `.mode.live` or `.mode.self`, title, `.mini`, `.caret ▶`) · ONE live widget
(`div.wk` with wk-head / wk-body / wk-foot, as in the templates) in one of the Parts, computed in the
page, constructed inputs declared in its wk-hint or wk-foot · section#demo-1 Build-along (kicker
`.tag.demo "★ 22 min · everyone builds"` on practitioner pages, "★ 17 min · everyone builds" on leader
pages, .lede, ONE figure, `.steps > .step > div > h4 + p`, practitioner steps carry a
`.prompt-box.good` with a `span.label` BELOW the p; leader build-alongs are no-code) · section#quiz
(3 x `.quiz-q data-answer="0-based"`, `p.qtext`, three `button.qopt` "A · ...", `p.qwhy`; one
`div.quiz-score` after the last; vary the correct letter) · section#homework (leader: .steps like a1;
practitioner: an `ol` of 4 items like p1) · section#official, h2 EXACTLY "What this session teaches, and
where it came from", `.covered > .covered-row` (pill solid ✓ / inkpill ◐ / light ○ + name + note),
then `<p class="mono">Every fact on this page, and its verification tier, is recorded in the course's
source map.</p>` · section#cheatsheet (h2 "Cheat sheet", `.cheat` of eight `.cheat-item`) ·
`.callout.next` with `.nx-pill` "Next session" · footer.pagefoot · `<script src="../assets/app.js?v=1">`.

Head: the template's social meta block with this page's own title/description/url;
`<title>Leader session N · Title - learn physical ai robotics with phoebe</title>` (or Practitioner);
`<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else external.

First `details.card` in the intro and the first card in Part 1 are `open`; the first card in other Parts
may be open as in the templates. Sentence case headings. Warm practitioner voice, concrete, never dry.
Inside prompt-boxes and widgets escape `&` `<` `>`. 450 to 700 lines is guidance about depth, never a
target: never collapse whitespace, dissolve a list into a paragraph, or drop a component to fit.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact estate phrases above are the only
  self-references; "session 5" / "practitioner session 7" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or is labelled constructed. A widget may compute new constructed
  numbers; prose may quote ONLY numbers the map records or that your widget prints at its default
  settings (and then run it in your head carefully, or better: compute it with node and the engine
  before quoting). For constructed data print "your numbers will differ", never invented outputs as if run.
- Practitioner code: if you show an "expected output", you must have run the code (python3 -I from a
  scratch directory under /private/tmp, never the repo) and copied the output exactly. Otherwise show
  no output block, say "run it and read the output".
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not.
  When general-purpose robots arrive is contested: no page gives a date.
- Citations as the map's appendix: author(s) and year, arXiv id; paywalled standards say "reported".
- NEVER "lottery" or "lotteries"; say the mechanism.
- Default to English words; no Chinese terms.
- NO company names, robot brands, product names, vendor names, prices, funding, market sizes, named
  incidents, or roadmaps. Name research by author and year only (not the institutions behind it). Not
  legal advice on safety standards. Not investment advice anywhere money is near.
- Titles, widget ids and class names must not collide with siblings: use ONLY the prefix scheme below.
  The family title "Why the warehouse playbook breaks here" for a5 is deliberate.
- Wrenfield Lab is CONSTRUCTED: say so on the page (masthead .sub and wherever its numbers appear).
  "Tidewater" is another course's case: never use it.

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): ink `#2A1222` · deep `#6B0546` · primary `#9B0865` ·
mid `#B5338B` · soft `#EBB8D7` · tint `#FCEFF7` · muted `#66505E` · faint `#D9C6D1` · hairline `#EFE3EA` ·
marigold `#F4B63C` · marigold tint `#FEF4DD` · marigold text `#7A4F00` · `#FFFFFF` · universal reds
`#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel.
Text on fills: ink on white/tint/soft/marigold/marigold tint; WHITE only on primary `#9B0865` and deep
`#6B0546`. Never text on mid `#B5338B` or faint. Muted text only on white or tint.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg" role="img"
  aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `wrn` + page id + letter, e.g. `wrna2a`,
  `wrna2b`, `wrnp7a`. Widget ids: `wrn<page>-name`, e.g. `wrnp7-calc`. No other prefixes.
- `<defs>` holds three things with the figure prefix P: a wobble filter `id="PSk"`
  (`feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="<int>"` +
  `feDisplacementMap scale="2.4" xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%"
  width="106%" height="106%"`), a hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one
  `#9B0865` line, opacity .5), an open arrowhead `id="PAr"` (path `M1 1 L9 5 L1 9`, fill none, ink stroke
  1.6). ALL shapes sit inside ONE `<g filter="url(#PSk)" fill="none" stroke="#2A1222" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">`; rects carry a tiny rotation (under 1 degree for
  panels). Fills: white, tint, the hachure for "the pile" or "the data", and marigold ONLY for the one
  thing the figure is about. One doodle anchor per figure (a gripper, a parcel, a camera), simple strokes,
  never a mascot. Text classes: `.PH` 800 12px ink heading · `.PL` 600 12px ink label · `.PS` 400 11px
  muted · `.PK` 400 11px ink (use on marigold or hachure fills) · `.PV` 800 16-20px deep value · `.PW`
  800 12px white on a primary/deep fill · `.PA` 700 11px primary axis caption · `.PN` 400 12px muted note.
- ALL `<text>` OUTSIDE any filtered group, `font: ... Inter, sans-serif`, never below 10.5px.
- Fit: max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under 110 chars;
  40px between neighbouring point labels; bottom note 22px below the last row, H clears it by 8px. No
  path may cross a label (the gate flags line-through-text): break lines around labels. When in doubt,
  shorten.
- Floor: one figure per Part plus one in the build-along (4 figures). Draw the MECHANISM (where the
  camera sits and what moves with it; the leader arm the action is read from; the interval that overlaps;
  the funnel of discarded takes), never a metaphor literally, never decoration.

## Voice and honesty

Every Part gets a real-world story from the map's research (by author and year). Wrenfield is
constructed and says so. Robotics safety is not a compliance checklist here: describe standards as
reported and teach the data consequence.

## Cross-links (absolute URLs, only these)

- https://phoebefu6.github.io/learn-autonomous-driving-with-phoebe/ (long tail, rare events, miles, disengagements)
- https://phoebefu6.github.io/learn-iot-data-with-phoebe/ (clocks, sampling, resampling, RUL)
- https://phoebefu6.github.io/learn-computer-vision-with-phoebe/ (vision models)
- https://phoebefu6.github.io/learn-ai-evals-with-phoebe/ (LLM evals)
- Hub: https://phoebefu6.github.io/learn-with-phoebe/
Internal links use relative file names from the list below.

## Footer chain and session titles

Footer `<p>`: "Leader session N of 6 · learn-physical-ai-robotics-with-phoebe · by Phoebe Fu &nbsp;·&nbsp;
📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>" (Practitioner
session N of 10 likewise). `nav.pagenav`: "← Prev: <title>" and "Next: <title> →"; a6 next is
"Course home →" to ../index.html; p9 next is p10.

Leader (files in courses/):
- a1-the-robot-is-a-data-loop.html · The robot is a data loop
- a2-demonstrations-are-the-dataset.html · Demonstrations are the dataset
- a3-what-a-success-rate-can-and-cannot-tell-you.html · What a success rate can and cannot tell you
- a4-reading-a-robot-demo-claim.html · Reading a robot demo claim
- a5-why-the-warehouse-playbook-breaks-here.html · Why the warehouse playbook breaks here
- a6-from-warehouse-to-physical-ai.html · From warehouse to physical AI: the transfer map
Practitioner:
- p1-anatomy-of-an-episode.html · Anatomy of an episode
- p2-coordinate-frames-and-calibration.html · Coordinate frames and calibration
- p3-teleop-data-quality.html · Teleop data quality
- p4-mixing-data-across-robots.html · Mixing data across robots
- p5-actions-as-data.html · Actions as data
- p6-domain-randomization.html · Domain randomization
- p7-evaluating-a-policy-in-20-trials.html · Evaluating a policy in 20 trials
- p8-the-intervention-log-as-labels.html · The intervention log as labels
- p9-shared-space-and-stop-logs.html · Shared space and stop logs
- p10-the-sim-to-real-bench.html · The sim-to-real bench

## Before you return

Self-check your file: no em/en dash (grep for U+2014 and U+2013), every `<details>`/`<section>`/`<figure>`/
`<svg>`/`<text>` balanced, every hex in figures is from the palette list, every figure prefix unique and
used only in its figure, quiz has exactly 3 questions and one quiz-score. Then return the path and one
line of coverage, plus any source you read that the map lacks and any contradiction you saw with another
page.

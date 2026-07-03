# Project Scope

## Goal
A greedy upgrade-path optimizer / planner for **Immortality Incremental** (an idle/incremental game). Users input their current resources (law levels, materials, cores) and the app finds the optimal order to synthesize and upgrade Laws, accounting for farming time.

## Tech Stack
- **Runtime:** Vanilla JS (ESM, no framework)
- **Build:** Vite 8
- **Test:** Vitest 4 (globals mode)
- **Package manager:** npm (WSL/Windows shared node_modules: occasional `npm install @rolldown/binding-linux-x64-gnu` needed)

## Architecture (data-driven)
```
public/            → Static assets served at BASE_URL (currently /II-Law-Calc/)
  wiki/             — Screenshots used in wiki (ash tree law secret)
  Icon.png          — Favicon

data/              → Static game data (JSON)
  laws.json          — 9 laws (name, tier, materials[], buffs{})
  materials.json     — 11 materials (material, mark, ratePerSecond)
  tiers.json         — tier configs + coreRatePerSecond + maxLevel

src/
  main.js            → Entry: mounts to #app div
  state.js           → State factory + multiplier computation
  bigNum.js          → Arbitrary-precision {mantissa, exponent} math
  suffixParser.js    → Parse number strings with game suffixes
  costCalculator.js  → Upgrade cost formulas
  farming.js         → Farming time estimation (actual vs total)
  optimizer.js       → Greedy best-next + full path optimizer
  afkOptimizer.js    → Long AFK bottleneck analysis
  markTime.js        → Mark milestone tier simulation
  data/index.js      → Re-exports JSON + helper getters
  ui/
    app.js           → Main controller: state, persistence, tabs, wiring
    statePanel.js    → Sidebar inputs (laws, mats, cores, settings, mult toggles)
    optimizerPanel.js → Best next + full path table with farming details
    afkPanel.js      → AFK recommendation + Farming Time Calculator
    wikiPanel.js     → Reference tables + Relevant Upgrades section with images
    markTimePanel.js → Mark time estimator with milestone sim
    styles.css       → Dark theme (~680 lines)
```

Game data lives in `data/*.json`. Adding entries = no code changes (except new metric types → update `ALL_METRICS` in `optimizer.js`). Public assets in `public/` are referenced as `<img src="${import.meta.env.BASE_URL}path/...">`.

## Key Files
| File | Purpose |
|------|---------|
| `src/state.js` | `createState()` factory — add new checkbox params here + `computeMultipliers()` |
| `src/ui/app.js` | Main controller — wire new state fields, callbacks, persistence, export/import |
| `src/ui/statePanel.js` | Render the sidebar — add new UI controls here |
| `src/optimizer.js:6` | `ALL_METRICS` array — add new buff types here |

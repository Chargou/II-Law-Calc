# Features

## High-Level User Features

### Law Calc Tab (main)
- Input law levels (0-10 per law), material counts, core count
- Choose a **metric** (Qi, Divinity, Citizens, Damage, Manual Luck, Disciple Luck, Remnants) or enable **Advanced mode** for per-metric weight sliders
- See **Best Next Upgrade** card (law, level change, cost, score, farming time)
- See **Full Upgrade Path** table (click rows to expand farming details per step)
- **Done button** on each step — applies upgrade and advances state
- **AFK Recommendation** — tells you what single resource to farm for a given time budget
- Toggle **Actual time** (uses current inventory) vs **Total time** (assumes full cost)

### Wiki Tab
- How Law Synthesis Works explanation
- **Relevant Upgrades** section — details each multiplier source (reincarnation, ash secret, stage 300, ash tree, divinity board 3) with unlock conditions and in-game context
- Ash Tree entry has a **Show/Hide images** toggle button that reveals location screenshots from `public/wiki/`
- A **? badge** on the sidebar's "Mats & Cores multipliers" header teleports to the Relevant Upgrades section in the wiki
- Marks & Materials table with base rates and "Your avg time / mat" column (adjusted by current multipliers)
- Cores section with base rate + "Your beast core rate" (adjusted by current core mult)
- Tiers reference table
- Laws reference table (per-level buffs, level 1 cost, level 10 total cost)

### AFK Tab
- **AFK Recommendation** — given a time budget, tells you which resource to AFK to make progress on the next bottleneck upgrade
- **Farming Time Calculator** — pick a resource, enter a suffixed amount, choose target/extra toggle, and see estimated time to farm it

### Mark Time Tab
- **Mark Time Estimator:** given MPS, rarity, clone, target amount, optional milestone progress → expected time
- **Milestone Progression:** given MPS and total opens, compute progress after a duration, or compute time to reach a target tier

### General
- **Export/Import** full state as JSON
- **localStorage persistence** for state, settings, and mark-time inputs
- Dark theme, responsive layout

## Important Low-Level Code Features

### Multiplier System (`state.js: computeMultipliers`)
Multiplicatively stacks all sources:
| Source | Mat mult | Core mult |
|--------|----------|-----------|
| Reincarnation | ×2 | ×3 |
| Ash Secret | ×2 | ×2 |
| Stage 300 | ×2 | ×2 |
| Ash Tree | ×2 | — |
| Divinity board 3 (mats) | ×2 | — |
| Divinity board 3 (cores) | — | ×2 |
| "Other mat mult" input | custom | — |
| "Other core mult" input | — | custom |

### Cost Formula (`costCalculator.js`)
Cost per level: `base × (L + 1)` where `base` comes from `tiers[law.tier].{baseMaterial, baseCores}`.
Total cost from level A to B: `base × (B(B+1) - A(A+1)) / 2`. Max level = 10.

### BigNum (`bigNum.js`)
Numbers stored as `{ mantissa, exponent }` (normalized scientific: 1 ≤ |mantissa| < 10).
Supports: add, sub, mul, div, pow, log10, cmp, ceil, toString (plain < 1e6, suffixed < 1e306, scientific beyond).

### Suffix Parser (`suffixParser.js`)
Parses numbers like `1.5qd`, `2e50`, `3uVg`. Two-tier suffix system:
- Simple: k, M, B, T, qd, qn, sx, sp, oc, no, cent
- Compound: prefix (u/d/t/qa/qi/sx/sp/oc/no) + base (de/vg/tg/qag/qig/sg/st/og/ng)

### Milestone Tier System (`markTime.js`)
Milestones at every `10000 × 1.45^T` total opens. Each milestone crossed gives ×1.1 MPS boost.
Independent model: total opens count, NOT target procs per tier.

### Wiki Renders on Every Tab Switch
When the Wiki tab is selected, `computeMultipliers(state)` is called and the results are passed to `renderWikiPanel(el, matMult, coreMult)` so "Your avg time / mat", "Your beast core rate", and the Relevant Upgrades section all reflect current multipliers. The wiki re-renders on every tab switch.

### Image Toggle
The Ash Tree entry in Relevant Upgrades has a button that toggles visibility of two location screenshots. Images are served from `public/wiki/` using `import.meta.env.BASE_URL` to respect Vite's configured base path (`/II-Law-Calc/`).

### ? Teleport Link
A small circular `?` badge next to the "Mats & Cores multipliers" section header in the sidebar. Clicking it programmatically clicks the Wiki tab and scrolls to `#wiki-relevant-upgrades` via `scrollIntoView({ behavior: 'smooth' })`.

### Data Flow
```
User input → state.js state object → optimizer.js (greedy loop) → optimizerPanel.js render
                              ↕
                       app.js controller
                    (persistence, wiring)
```

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
- Marks & Materials table with base rates and your adjusted rates
- Cores section (base rate + your beast core rate)
- Tiers reference table
- Laws reference table (per-level buffs, level 1 cost, max level cost)

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

### Wiki "Your" Columns
When the Wiki tab is selected, `computeMultipliers(state)` is called and the results are passed to `renderWikiPanel(el, matMult, coreMult)` so the "Your avg time / mat" and "Your beast core rate" reflect current multipliers. The wiki re-renders on every tab switch.

### Data Flow
```
User input → state.js state object → optimizer.js (greedy loop) → optimizerPanel.js render
                              ↕
                       app.js controller
                    (persistence, wiring)
```

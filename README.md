# II Law Calc — Immortality Incremental Law Synthesization Optimizer

Greedy upgrade-path optimizer for **Immortality Incremental** with a Mark Time estimator and game reference wiki.

## Tabs

### Law Calc
Given your current resources (materials, cores, law levels), finds the best upgrade order based on your chosen metric or weighted combination of metrics. Simulates farming time and shows actual deficits per step.

1. Set your **law levels**, **materials**, and **cores** in the left panel
2. Choose a **metric** or enable **Advanced mode** to set weights
3. The optimizer shows the **Best Next Upgrade** and the **Full Upgrade Path**
4. Click any path row to expand **farming details** per step
5. Click **Done** on a step to apply it and advance your state
6. Use the **AFK recommendation** for idle farming sessions

### Wiki
Reference tables for laws (per-level buffs, tier costs), mark-to-material rates with average proc times, core rates, and game mechanics explanations.

### Mark Time
Estimates the expected time to farm a target amount of a specific mark, with optional milestone support (independent model: 10000 × 1.45^T total opens per milestone). MPS input includes current tier's ×1.1 boost. Live-updating results — no buttons needed.

**Milestone Progression** card: compute opens and tier after a given duration, or compute time needed to reach a target tier. Duration input accepts colon format (`hh:mm:ss`) and `h`/`m`/`s` formats.

## Features

- **Greedy optimizer** — picks the highest-scoring next upgrade, repeats for a full path
- **Metric scoring** — choose a single metric (Qi, Divinity, Citizens, etc.) or use **Advanced mode** with per-metric weights
- **Actual / Total time** — Actual time uses current inventory; Total time assumes full cost
- **AFK recommendation** — finds the longest bottleneck that fits within your time budget
- **Reincarnation** — checkbox doubles material rates (×3 cores)
- **Ash Secret** — checkbox adds another ×2 to both rates
- **Custom rate multipliers** — manual input for additional material/core rate scaling
- **Done button** — click a step's Done button to apply the upgrade to your state
- **Export / Import** — full state as a shareable JSON file
- **Dark theme** with responsive layout for mobile and desktop
- **localStorage persistence** — state, settings, and mark-time inputs save automatically
- **BigNum** — `{ mantissa, exponent }` handling for arbitrarily large numbers (plain, suffixed, or scientific display)
- **Suffix parser** — case-insensitive parsing of suffixed values (k/M/B/T through Nonagintillion, plus scientific `e<N>`)

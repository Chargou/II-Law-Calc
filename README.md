# II Law Calc — Immortality Incremental Law Synthesization Optimizer

A tool to plan your Law upgrades in **Immortality Incremental**. Enter your current progress and it tells you what to upgrade next, how long it'll take, and what to farm while AFK.

**[Use it here](https://chargou.github.io/II-Law-Calc/)**

---

## Law Calc Tab (main)

1. **Set your current resources** in the left panel:
   - Law levels (0-10 each)
   - Material counts
   - Cores
2. **Pick a metric** to optimize for (Qi, Divinity, Citizens, Damage, Manual Luck, Disciple Luck, Remnants) — or enable **Advanced mode** to set custom weights per metric
3. The optimizer shows:
   - **Best Next Upgrade** — the single best law to level up next, with cost and farming time
   - **Full Upgrade Path** — a full sequence of upgrades, best-first
4. Click any row in the path to see **farming details** — exactly what resources you need to farm and for how long
5. Click **Done** on a step to apply it and advance your state
6. The **AFK Recommendation** tells you what single resource to focus on during idle sessions
7. Toggle **Actual time** (considers what you already have) vs **Total time** (assumes full cost from zero)

### Multipliers

Open the **Mats & Cores multipliers** section to set:

| Checkbox | Effect |
|----------|--------|
| First reincarnation done | 2× mat rate, 3× core rate |
| Ash Secret Maxed | 2× both rates |
| Stage 300 | 2× both rates |
| Ash Tree — Law secret upgrade | 2× mats |
| Divinity board 3 | 2× mats |
| Divinity board 3 | 2× cores |
| Other mat / core mult | Custom multiplier (manual input) |

All multipliers stack multiplicatively.

### Export / Import
Export your full state (law levels, materials, cores, all settings) as a JSON file to share or back up. Import to restore.

---

## Wiki Tab

Reference tables for:
- **Marks & Materials** — material rates, base and adjusted for your multipliers
- **Cores** — base and your current beast core rate
- **Tiers** — cost scaling info
- **Laws** — per-level buffs, level 1 and max level costs

---

## Mark Time Tab

- **Mark Time Estimator** — enter your MPS (includes current tier boost), target rarity, clone multiplier, target amount, and optionally your milestone progress to get the expected farming time
- **Milestone Progression** — given your MPS and total opens, see how far you'll get after a given duration, or how long to reach a target tier

Inputs support big numbers with suffixes (e.g., `1.5qd`, `2e50`) and auto-save.

---

Data saves automatically in your browser (localStorage). No account needed.

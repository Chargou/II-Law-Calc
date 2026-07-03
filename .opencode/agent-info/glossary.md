# Agent Wiki: Immortality Incremental Lingo

## Game Concepts

### Mark
A "mark" is a farmable resource node. Each mark produces a specific **material** over time at a given rate (procs/second). Examples: Mark of Insight → Lucent, Mark of Soulfire → Cindral.

### Material
The resource produced by a mark. Spent to synthesize and upgrade laws. 11 materials exist.

### Law
A permanent buff that can be synthesized and upgraded. Each law has a **tier** (lesser/greater/origin), requires specific **materials**, and grants per-level **buffs**. 9 laws exist, max level 10.

### Tier
Three tiers: **Lesser** (base 5 mats, 25k cores), **Greater** (base 10 mats, 50k cores), **Origin** (base 15 mats, 100k cores). Cost scales linearly per level.

### Buff types (metrics)
Laws buff these account stats. The optimizer scores upgrades based on weighted buff gains:
- **Qi** — breakthrough currency (key stat)
- **Divinity** — god-like resource
- **Citizens** — population
- **Damage** — combat
- **Manual Luck** — luck from clicking
- **Disciple Luck** — luck from disciples
- **Remnants** — prestige-ish resource
- **Breakthrough Cost** — special buff: reduces Qi cost (inverted in scoring: `Qi gain × (1 / BreakthroughCost)`)

### Cores
A secondary resource generated at a flat rate (base: 10 cores / 0.25s = 40/s). Required alongside materials for all upgrades.

### Reincarnation
A game milestone. When marked complete: ×2 material rate, ×3 core rate.

### Ash Secret
A law secret upgrade. When maxed: ×2 both rates.

### Stage 300
A game stage milestone. ×2 both rates.

### Ash Tree (Law secret upgrade)
A law secret upgrade. ×2 material rate.

### Divinity board 3
A divinity tree upgrade. Two separate bonuses: ×2 material rate and ×2 core rate.

### Beast Core Rate
Your effective core generation rate after applying all multipliers (checkboxes + manual input).

## Non-Obvious Code Info

### "Your avg time / mat" column
In the Wiki Marks & Materials table. Computed as `1 / (ratePerSecond × totalMatMult)` using the player's current multiplier setup. When totalMatMult is high, values become sub-second → displayed with decimals.

### Milestone model (Mark Time tab)
Milestones are at `10000 × 1.45^T` **total opens** (not per-tier targets). Each milestone crossed gives ×1.1 MPS boost. The model is independent — total opens accumulated across all time, not per-mark.

### MPS input in Mark Time
The MPS input should already include your current tier's ×1.1 boost (the tooltip/help says this). The milestone engine then applies additional ×1.1 boosts as tiers are crossed.

### State serialization
State is saved to two localStorage keys:
- `ii-law-calc-state` — game state (law levels, mats, cores, checkbox toggles)
- `ii-law-calc-settings` — UI settings (weights, afk hours, time mode, advanced mode)
- `ii-law-calc-mark-time` — mark time panel input values

Plus full JSON export/import via file download (version 1 format).

### Adding a new multiplier checkbox
1. `state.js` — add param to `createState()`, add to returned object, add `if (...)` to `computeMultipliers()`
2. `app.js` — add to `loadState()`, `saveState()`, `serializeFullState()`, `applyFullState()`, add callback handler, pass callback in all `renderStatePanel()` calls
3. `statePanel.js` — add checkbox HTML in the template, add event listener

### Tab system
Three tabs (Calc, Wiki, Mark Time) using `data-tab` + `tab-content` classes. The wiki re-renders on each tab switch to reflect current multipliers.

### "Done" button per path step
Clicking "Done" on a step in the upgrade path applies the upgrade (spends resources, increases law level) and recalculates the remaining path. This lets users work through the path incrementally.

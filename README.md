# II Law Calc — Immortality Incremental Law Synthesization Optimizer

Greedy upgrade-path optimizer for **Immortality Incremental** Law Synthesization.

## What it does

Given your current resources (materials, cores, law levels), the optimizer finds the best upgrade order based on your chosen metric or weighted combination of metrics. It simulates farming time and shows actual deficits per step.

## How to use

1. Set your **law levels**, **materials**, and **cores** in the left panel
2. Choose a **metric** or enable **Advanced mode** to set weights
3. The optimizer shows the **Best Next Upgrade** and the **Full Upgrade Path**
4. Click any path row to expand **farming details** per step
5. Click **Done** on a step to apply it and advance your state
6. Use the **AFK recommendation** for idle farming sessions

## Features

- **Greedy optimizer** — picks the highest-scoring next upgrade, repeats for a full path
- **Metric scoring** — choose a single metric (Qi, Divinity, Citizens, etc.) or use **Advanced mode** with per-metric weights for a custom scoring formula
- **Actual / Total time** — Actual time uses current inventory; Total time assumes full cost
- **AFK recommendation** — finds the longest bottleneck that fits within your time budget
- **Reincarnation** — checkbox doubles material rates (×3 for cores)
- **Ash Secret** — checkbox adds another ×2 to both rates
- **Custom rate multipliers** — manual input for additional material/core rate scaling
- **Done button** — click a step's Done button to apply the upgrade to your state (deducts resources, levels the law, recomputes the path)
- **Export / Import** — full state as a shareable JSON file
- **Dark theme** with responsive layout for mobile
- **localStorage persistence** — everything saves automatically
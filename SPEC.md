# Law Planner Spec

Goal: optimize upgrade order.

Player state:
- current law levels
- current materials
- current cores

Primary mode:
- choose one metric (Qi, Divinity, Citizens...)
- recommend best next upgrade
- later: full upgrade path
- optional max-time filter

Secondary modes:
- best AFK activity for X hours (one mark or cores)
- weighted optimization with user-defined stat values

Rules:
- One mark at a time.
- Material farming and core farming are mutually exclusive.
- Core rate = 40/sec.
- Expected values only (no RNG simulation).
- Upgrade cost from level n→n+1 = base*(n+1).
- Buff multiplier is constant per level.

Display:
- Actual Time Cost = additional farming needed.
- Total Time Cost = actual time + expected time value of inventory spent.

Greedy selection is acceptable for v1.

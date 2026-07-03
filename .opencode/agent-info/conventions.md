# Conventions

## Commit Rules

### Significant changes = separate commits
Each logical feature or fix gets its own commit. Examples:
- Adding a new checkbox → one commit
- Wire persistence for it → include in same commit as the feature
- Bumping version → its own commit at the end

### Bump protocol
When user says "bump to X.Y.Z":
1. First update `.opencode/agent-info/` files with any new features/changes added this version
2. Then bump version in `package.json` and `index.html`
3. Commit with version bump message
4. User pushes to GitHub Pages

### Bug fix for previous commit → squash / amend
If a bug is found in the most recent commit, do NOT create a new commit — amend the previous one:
```bash
git add -A && git commit --amend --no-edit
```
If the bug was a few commits back, use an interactive rebase (`git rebase -i`) to squash the fix into the original commit.

### Commit message style
Short (≤72 char) first line, then blank line, then bullet details. Examples:
```
Add Stage 300 checkbox (2x mats & cores)

- state.js: add stage300 param, multiplier logic
- app.js: persistence, callback wiring
- statePanel.js: checkbox UI
```

```
Wiki: add 'Your avg time / mat' column to Marks & Materials table

- wikiPanel.js: accept matMult param, add column
- app.js: compute matMult on tab switch, re-render each time
```

### Bump version when user asks
Update in two files:
- `package.json` — `"version": "X.Y.Z"`
- `index.html` — both `<title>` text and `<span class="version">` text

These should always match. Currently at **1.11.0** (display v1.11).

## Coding Conventions

### No JS framework
Vanilla JS with Vite for bundling. No React, Vue, etc.

### ESM imports
All modules are ESM (`import`/`export`). `package.json` has `"type": "module"`.

### No comments in code
Code should be self-documenting. Use descriptive function/variable names instead.

### Data-driven
Game data lives in `data/*.json`. Adding new laws or materials should NOT require code changes in most cases (exception: new buff types need adding to `ALL_METRICS` in `optimizer.js`).

### State pattern
State is a plain object created by `createState()`. Pure functions operate on it (no methods). The UI controller (`app.js`) is the only place that mutates state and triggers re-renders.

### Testing
Run `npm test` before committing. All tests must pass. Vitest with globals mode.

### UI rendering
UI modules render by setting `innerHTML` and attaching event listeners. No virtual DOM. The wiki re-renders on every tab switch to show current multiplier values.

## Adding a New Multiplier Checkbox (checklist)

1. `src/state.js`:
   - Add param to `createState()` (default `false`)
   - Add to the returned object
   - Add `if (state.xxx) { matMult *= N; coreMult *= N; }` in `computeMultipliers()`

2. `src/ui/app.js`:
   - Add to `loadState()` call
   - Add to `saveState()` object
   - Add `onXxxChange` handler function
   - Add to `serializeFullState()` and `applyFullState()`
   - Pass callback in ALL `renderStatePanel()` calls (there are 3)

3. `src/ui/statePanel.js`:
   - Add checkbox HTML in the template
   - Add event listener

## Adding New Laws or Materials

1. Append to `data/laws.json` or `data/materials.json`
2. If new tier → add to `data/tiers.json`
3. If new buff type → add to `ALL_METRICS` in `src/optimizer.js:6`

That's it — everything else iterates the data arrays.

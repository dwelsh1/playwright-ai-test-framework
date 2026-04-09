# Smart Reporter — Manual Testing Guide

## Prerequisites

- Coffee Cart app running locally at `http://localhost:5273` (required for `coffee-cart` and `all-apps` configs)
- Internet access to `https://www.saucedemo.com` (required for `sauce-demo` and `all-apps` configs)
- `TEST_ENV` must **not** be set (or set to `dev`) — check with `echo $env:TEST_ENV` in PowerShell
- If it says `staging`, clear it: `Remove-Item Env:TEST_ENV`
- Smart reporter built: `npm run build:smart-reporter`

---

## Running the Tests

Three pre-configured report profiles are available. Use the generic smart-reporter helpers with a profile name from `report-configs/`.

```powershell
# Coffee Cart tests only (chromium project)
npm run test:smart:config -- coffee-cart -- --project=chromium --workers=4

# Sauce Demo tests only (sauce-demo project)
npm run test:smart:config -- sauce-demo -- --project=sauce-demo --workers=4

# All apps — Coffee Cart + Sauce Demo combined
npm run test:smart:config -- all-apps -- --project=chromium --project=sauce-demo --workers=4
```

To switch config without running tests (e.g. to inspect the settings):

```powershell
npm run config:report -- coffee-cart
npm run config:report -- sauce-demo
npm run config:report -- all-apps
```

---

## Serve the Report

Each config writes to its own output file so all three can be served simultaneously without overwriting each other.

```powershell
# Each in its own terminal
npm run report:smart:serve -- coffee-cart
npm run report:smart:serve -- sauce-demo
npm run report:smart:serve -- all-apps
```

Each command prints its own URL (e.g. `http://localhost:3000`). Refreshing a tab will always show that config's report regardless of which other configs have run.

| Config        | Output file                                       |
| ------------- | ------------------------------------------------- |
| `coffee-cart` | `playwright-report/smart-report-coffee-cart.html` |
| `sauce-demo`  | `playwright-report/smart-report-sauce-demo.html`  |
| `all-apps`    | `playwright-report/smart-report-all-apps.html`    |

> Opening the `.html` file directly as a `file://` URL will work for most features but trace links will not load.

---

## Expected Output per Config

### Test Counts

| Config        | Command                                                                                        | Passed | Failed | Flaky  | Notes                                    |
| ------------- | ---------------------------------------------------------------------------------------------- | ------ | ------ | ------ | ---------------------------------------- |
| `coffee-cart` | `npm run test:smart:config -- coffee-cart -- --project=chromium --workers=4`                   | Varies | Varies | Varies | Coffee Cart only                         |
| `sauce-demo`  | `npm run test:smart:config -- sauce-demo -- --project=sauce-demo --workers=4`                  | Varies | Varies | Varies | Requires `saucedemo.com` to be reachable |
| `all-apps`    | `npm run test:smart:config -- all-apps -- --project=chromium --project=sauce-demo --workers=4` | Varies | Varies | Varies | Coffee Cart + Sauce Demo combined        |

> Stat bubbles in the sidebar update dynamically when filters are active — e.g. clicking the **Failed** chip changes the display to **0 / 2 / 0**. Clearing filters restores the original totals.

### Metadata (Breadcrumb + Build Info)

| Config        | Breadcrumb                                        | Env        | Branch                 | Commit   | Pipeline |
| ------------- | ------------------------------------------------- | ---------- | ---------------------- | -------- | -------- |
| `coffee-cart` | `acme-corp › ecommerce › coffee-cart`             | staging    | main                   | f3a9c21b | #101     |
| `sauce-demo`  | `acme-corp › retail-platform › sauce-demo`        | production | release/v2.1           | 8d4e1a7f | #202     |
| `all-apps`    | `acme-corp › qa-platform › full-regression-suite` | staging    | feature/smart-reporter | abc1234d | #303     |

**Where to find:**

- **Breadcrumb** — top bar, between the hamburger menu and the Search button
- **Env pill** — green badge next to the breadcrumb (e.g. `staging`)
- **Branch / Commit / Pipeline** — footer bar at the bottom of the page

---

## Filter Groups to Verify

### PROJECT group (left sidebar, above BUILD)

| Config        | Org chip    | Team chip         | App chip                |
| ------------- | ----------- | ----------------- | ----------------------- |
| `coffee-cart` | `acme-corp` | `ecommerce`       | `coffee-cart`           |
| `sauce-demo`  | `acme-corp` | `retail-platform` | `sauce-demo`            |
| `all-apps`    | `acme-corp` | `qa-platform`     | `full-regression-suite` |

Clicking a chip should filter the test list to tests matching that value. Clicking again deselects it. The group header shows a count badge when any chip is active.

### BUILD group (left sidebar, below PROJECT)

| Item                     | Type         | Description                                       |
| ------------------------ | ------------ | ------------------------------------------------- |
| Env / Branch / Commit    | Info rows    | Non-clickable metadata display                    |
| Playwright project chips | Filter chips | Narrow the test list to only that project's tests |

The Playwright project chips shown depend on which config was run:

| Config        | Expected chips                                     |
| ------------- | -------------------------------------------------- |
| `coffee-cart` | `chromium (N)`, `user-setup (N)`                   |
| `sauce-demo`  | `sauce-demo (N)`                                   |
| `all-apps`    | `chromium (N)`, `user-setup (N)`, `sauce-demo (N)` |

---

## Collapse / Expand Behaviour

1. Click the **PROJECT** or **BUILD** group header — it should collapse, hiding its chips
2. Reload the page — collapsed state should be **remembered** (stored in `localStorage`)
3. Click again to expand

---

## Clear Filters

1. Activate any chip in PROJECT or BUILD
2. Click **Clear filters** (×) at the top of the sidebar
3. All chips across all groups should deselect, including PROJECT and BUILD

---

## Saved Views

The **Saved Views** panel sits below the filter groups in the sidebar.

### Save a view

1. Activate one or more filter chips (status, PROJECT, BUILD, etc.)
2. Click **+ Save current view** at the bottom of the sidebar
3. Type a name (e.g. `Failing chromium`) and click **Save**
4. The view should appear in the list

### Apply a view

1. Click a saved view name — the active filter chips should change to match the saved state
2. The active view is highlighted in the list
3. Apply a different view — the previous highlight should clear

### Delete a view

1. Hover over a saved view — an **×** button should appear
2. Click **×** — the view is removed from the list immediately
3. Reload — the view should stay deleted (tracked in `localStorage`)

### Export / Import

1. Click the **↓** (export) icon in the saved views header
2. A `smart-reporter-views.json` file should download with your saved views
3. Clear all views (delete each) then click the **↑** (import) icon and select the downloaded file
4. Your views should reappear

---

## Extended Search

Press **⌘K** (or **Ctrl+K**) to open the search modal.

### Search by error text

1. Run a config that has failing tests (e.g. `coffee-cart`)
2. Open search and type part of an error message (e.g. `intentional` or `expect`)
3. Matching failed tests should appear with a red error snippet below their title

### Search by build metadata

1. Type the branch name (e.g. `main` or `feature/smart-reporter`)
2. If history has runs from that branch, a **Runs** group should appear below the **Tests** group showing pass rate, total tests, and date

### Search by environment

1. Type `staging` or `production`
2. Matching history runs should appear in the **Runs** section

---

## Known Environment Quirks

| Symptom                                                 | Cause                                                        | Fix                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| Only 1 test runs and fails with `ERR_NAME_NOT_RESOLVED` | `TEST_ENV=staging` set as a Windows env var                  | `Remove-Item Env:TEST_ENV`                                           |
| All configs show the same branch                        | `GITHUB_ACTIONS` + `GITHUB_REF_NAME` set in Windows env vars | Config file values take priority — rebuild smart reporter and re-run |
| `project: {}` in report (no PROJECT group)              | Report was generated before latest build                     | Re-run `npm run build:smart-reporter` then re-run the test command   |
| Traces don't load                                       | Report opened as `file://`                                   | Use the `serve` command above                                        |
| `sauce-demo` shows 0/0/0                                | Wrong Playwright project specified                           | Ensure command uses `--project=sauce-demo`, not `--project=chromium` |

---

## Config Files

Preset configs live in `report-configs/`. Edit them freely to test different metadata combinations.

| File                              | Used by                                |
| --------------------------------- | -------------------------------------- |
| `report-configs/coffee-cart.json` | `npm run config:report -- coffee-cart` |
| `report-configs/sauce-demo.json`  | `npm run config:report -- sauce-demo`  |
| `report-configs/all-apps.json`    | `npm run config:report -- all-apps`    |

The active config is always `playwright-report-settings.json` in the repo root. The `config:report` helper overwrites it from the selected preset.

---

## Checklist

- [x] Breadcrumb shows correct org › team › app for each config
- [x] Env pill shows correct environment colour (green = staging/production)
- [x] Footer shows correct branch, commit, and pipeline number
- [x] Footer text does not wrap to a second line
- [x] PROJECT filter group is visible with correct org / team / app chips
- [x] BUILD filter group shows correct Playwright project chips per config
- [x] Clicking a PROJECT chip filters the test list (single-run reports: all tests remain visible — correct, all share the same project context; multi-project filtering requires Phase 5 multi-run merging)
- [x] Clicking a BUILD Playwright project chip filters the test list
- [x] Stat bubbles update dynamically when a filter chip is active (e.g. Failed → 0/2/0)
- [x] Stat bubbles restore to original totals when filters are cleared
- [x] PROJECT and BUILD groups collapse and expand on header click
- [x] Collapsed state persists after page reload
- [x] Clear filters resets all groups including PROJECT and BUILD
- [x] Switching configs produces different breadcrumb and build info
- [x] `coffee-cart` report shows 85 passed, 2 failed, 0 flaky
- [x] `sauce-demo` report shows 2 passed, 0 failed, 0 flaky
- [x] `all-apps` report shows 87 passed, 2 failed, 0 flaky
- [x] Saved Views panel is visible in the sidebar below filter groups
- [x] Saving a filter state creates a named view in the list
- [x] Applying a saved view restores the correct filter chips
- [x] Deleting a saved view removes it and persists after reload
- [x] Export downloads a valid JSON file of saved views
- [x] Import merges views from a JSON file without duplicates
- [x] Search returns test results matching error text
- [x] Search returns grouped Runs results matching branch/env metadata

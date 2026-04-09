---
name: playwright-cli
description: Automates browser interactions for page exploration, flow inspection, screenshots, tracing, and action capture. Use when the user needs to navigate websites, inspect web pages, interact with flows, or capture browser actions before writing repo-compliant tests.
allowed-tools: Bash(playwright-cli:*)
---

# Browser Automation with playwright-cli

> **Mandatory — exclusive tool for pre-code UI exploration**
>
> | Requirement            | Detail                                                                                                                                                  |
> | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | **MUST use**           | `playwright-cli` for all UI page exploration before creating or editing page objects, selectors, or UI tests                                            |
> | **MUST NOT use**       | IDE browser MCP, Cursor-integrated browser tools, Playwright Test `codegen`, or any other browser automation tool for pre-code exploration              |
> | **Blocked without it** | If `playwright-cli` cannot run (auth failure, app unavailable, CLI error), **stop and notify the human** — do not guess, do not substitute another tool |
>
> This requirement is enforced by the **No Substitute UI Exploration** rule in the orchestrator (`CLAUDE.md`).

Use this skill for exploration and action capture. For final repo-compliant test authoring, follow the canonical test skills referenced below.

## Prerequisites

This repo installs **`@playwright/cli`** (devDependency). After `npm ci` / `npm install`, run `bash scripts/link-cli.sh "$(pwd -P)"` so `playwright-cli` is on `PATH` via `~/.local/bin` (post-create and `npm run setup` do this). Do **not** use the deprecated npm package `playwright-cli` (empty stub).

**Dev container:** `PLAYWRIGHT_CLI_BROWSERS_PATH=/ms-playwright-cli` (persisted **Docker volume** in `.devcontainer/devcontainer.json`) so CLI Chromium is **not re-downloaded** on container rebuild. **Local:** defaults to `~/.cache/playwright-cli-browsers`. The linked **`scripts/playwright-cli.sh`** applies this path. **`npm run playwright-cli:install-browsers`** is a no-op when the cache already matches the CLI’s Playwright version. **`.playwright/cli.config.json`** sets `channel: "chromium"` (no system Chrome at `/opt/google/chrome/chrome`).

## Quick start

```bash
# open new browser
playwright-cli open
# navigate to a page
playwright-cli goto https://playwright.dev
# interact with the page using refs from the snapshot
playwright-cli click e15
playwright-cli type "page.click"
playwright-cli press Enter
# take a screenshot (rarely used, as snapshot is more common)
playwright-cli screenshot
# close the browser
playwright-cli close
```

## Commands

### Core

```bash
playwright-cli open
# open and navigate right away
playwright-cli open https://example.com/
playwright-cli goto https://playwright.dev
playwright-cli type "search query"
playwright-cli click e3
playwright-cli dblclick e7
playwright-cli fill e5 "user@example.com"
playwright-cli drag e2 e8
playwright-cli hover e4
playwright-cli select e9 "option-value"
playwright-cli upload ./document.pdf
playwright-cli check e12
playwright-cli uncheck e12
playwright-cli snapshot
playwright-cli snapshot --filename=after-click.yaml
playwright-cli eval "document.title"
playwright-cli eval "el => el.textContent" e5
playwright-cli dialog-accept
playwright-cli dialog-accept "confirmation text"
playwright-cli dialog-dismiss
playwright-cli resize 1920 1080
playwright-cli close
```

### Navigation

```bash
playwright-cli go-back
playwright-cli go-forward
playwright-cli reload
```

### Keyboard

```bash
playwright-cli press Enter
playwright-cli press ArrowDown
playwright-cli keydown Shift
playwright-cli keyup Shift
```

### Mouse

```bash
playwright-cli mousemove 150 300
playwright-cli mousedown
playwright-cli mousedown right
playwright-cli mouseup
playwright-cli mouseup right
playwright-cli mousewheel 0 100
```

### Save as

```bash
playwright-cli screenshot
playwright-cli screenshot e5
playwright-cli screenshot --filename=page.png
playwright-cli pdf --filename=page.pdf
```

### Tabs

```bash
playwright-cli tab-list
playwright-cli tab-new
playwright-cli tab-new https://example.com/page
playwright-cli tab-close
playwright-cli tab-close 2
playwright-cli tab-select 0
```

### Storage

```bash
playwright-cli state-save
playwright-cli state-save auth.json
playwright-cli state-load auth.json

# Cookies
playwright-cli cookie-list
playwright-cli cookie-list --domain=example.com
playwright-cli cookie-get session_id
playwright-cli cookie-set session_id abc123
playwright-cli cookie-set session_id abc123 --domain=example.com --httpOnly --secure
playwright-cli cookie-delete session_id
playwright-cli cookie-clear

# LocalStorage
playwright-cli localstorage-list
playwright-cli localstorage-get theme
playwright-cli localstorage-set theme dark
playwright-cli localstorage-delete theme
playwright-cli localstorage-clear

# SessionStorage
playwright-cli sessionstorage-list
playwright-cli sessionstorage-get step
playwright-cli sessionstorage-set step 3
playwright-cli sessionstorage-delete step
playwright-cli sessionstorage-clear
```

### Network

```bash
playwright-cli route "**/*.jpg" --status=404
playwright-cli route "https://api.example.com/**" --body='{"mock": true}'
playwright-cli route-list
playwright-cli unroute "**/*.jpg"
playwright-cli unroute
```

### DevTools

```bash
playwright-cli console
playwright-cli console warning
playwright-cli network
playwright-cli run-code "async page => await page.context().grantPermissions(['geolocation'])"
playwright-cli tracing-start
playwright-cli tracing-stop
playwright-cli video-start
playwright-cli video-stop video.webm
```

## Open parameters

```bash
# Use specific browser when creating session
playwright-cli open --browser=chrome
playwright-cli open --browser=firefox
playwright-cli open --browser=webkit
playwright-cli open --browser=msedge
# Connect to browser via extension
playwright-cli open --extension

# Use persistent profile (by default profile is in-memory)
playwright-cli open --persistent
# Use persistent profile with custom directory
playwright-cli open --profile=/path/to/profile

# Start with config file
playwright-cli open --config=my-config.json

# Close the browser
playwright-cli close
# Delete user data for the default session
playwright-cli delete-data
```

## Snapshots

After each command, playwright-cli provides a snapshot of the current browser state.

```bash
> playwright-cli goto https://example.com
### Page
- Page URL: https://example.com/
- Page Title: Example Domain
### Snapshot
[Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

You can also take a snapshot on demand using `playwright-cli snapshot` command.

If `--filename` is not provided, a new snapshot file is created with a timestamp. Default to automatic file naming, use `--filename=` when artifact is a part of the workflow result.

## Browser Sessions

```bash
# create new browser session named "mysession" with persistent profile
playwright-cli -s=mysession open example.com --persistent
# same with manually specified profile directory (use when requested explicitly)
playwright-cli -s=mysession open example.com --profile=/path/to/profile
playwright-cli -s=mysession click e6
playwright-cli -s=mysession close  # stop a named browser
playwright-cli -s=mysession delete-data  # delete user data for persistent session

playwright-cli list
# Close all browsers
playwright-cli close-all
# Forcefully kill all browser processes
playwright-cli kill-all
```

## Local installation

If `playwright-cli` is not on `PATH`, use the scoped package (the `playwright-cli` package on npm is deprecated and has no binary):

```bash
npx @playwright/cli open https://example.com
npx @playwright/cli click e1
```

## Example: Form submission

```bash
playwright-cli open https://example.com/form
playwright-cli snapshot

playwright-cli fill e1 "user@example.com"
playwright-cli fill e2 "password123"
playwright-cli click e3
playwright-cli snapshot
playwright-cli close
```

## Example: Multi-tab workflow

```bash
playwright-cli open https://example.com
playwright-cli tab-new https://example.com/other
playwright-cli tab-list
playwright-cli tab-select 0
playwright-cli snapshot
playwright-cli close
```

## Example: Debugging with DevTools

```bash
playwright-cli open https://example.com
playwright-cli click e4
playwright-cli fill e7 "test"
playwright-cli console
playwright-cli network
playwright-cli close
```

```bash
playwright-cli open https://example.com
playwright-cli tracing-start
playwright-cli click e4
playwright-cli fill e7 "test"
playwright-cli tracing-stop
playwright-cli close
```

## Test Generation Workflow

Use `playwright-cli` to capture a user flow, then translate the snapshot and actions into a repo-compliant test.

### Step-by-Step

1. **Open and navigate** to the starting page:

```bash
playwright-cli open https://example.com/login
playwright-cli snapshot
```

2. **Perform the flow** step by step, taking snapshots at key points:

```bash
playwright-cli fill e5 "user@example.com"
playwright-cli fill e8 "password123"
playwright-cli click e12
playwright-cli snapshot --filename=after-login.yaml
```

3. **Review snapshots** to identify:
   - Element roles and accessible names (for `getByRole()`)
   - Labels (for `getByLabel()`)
   - Text content (for `getByText()`)
   - Any `data-testid` attributes (last resort)

4. **Translate to test code** using the canonical skills (`test-standards`, `selectors`, `page-objects`). The snapshots inform your locator choices -- do not copy raw element refs (e.g., `e5`) into test code.

### Example: Captured Flow → Test Code

Captured via `playwright-cli`:

```bash
playwright-cli open https://coffee-cart.app/login
playwright-cli snapshot
# Snapshot shows: textbox "Email", textbox "Password", button "Login"
playwright-cli fill e3 "test@example.com"
playwright-cli fill e5 "secret"
playwright-cli click e7
playwright-cli snapshot
# Snapshot shows: heading "Menu", navigation with links
```

Translated to page object + test:

```typescript
// Page object uses discovered roles/labels
get emailInput(): Locator { return this.page.getByLabel(/email/i); }
get passwordInput(): Locator { return this.page.getByLabel(/password/i); }
get submitButton(): Locator { return this.page.getByRole('button', { name: /login/i }); }

// Test uses Given/When/Then
await test.step('WHEN user logs in', async () => {
  await loginPage.login(email, password);
});
await test.step('THEN menu page loads', async () => {
  await expect(menuPage.page).toHaveURL(/\/$/);
});
```

## Device Emulation

Use `playwright-cli` with `resize` to test responsive layouts, or use `--browser` for cross-browser checks:

```bash
# Mobile viewport
playwright-cli open https://example.com
playwright-cli resize 375 812
playwright-cli snapshot --filename=mobile-view.yaml

# Tablet viewport
playwright-cli resize 768 1024
playwright-cli snapshot --filename=tablet-view.yaml

# Desktop viewport (reset)
playwright-cli resize 1920 1080
playwright-cli snapshot --filename=desktop-view.yaml
```

### Cross-Browser Testing

```bash
# Test on different browsers
playwright-cli open --browser=firefox https://example.com
playwright-cli snapshot --filename=firefox-view.yaml
playwright-cli close

playwright-cli open --browser=webkit https://example.com
playwright-cli snapshot --filename=webkit-view.yaml
playwright-cli close
```

Use device emulation during exploration to discover responsive breakpoints, mobile-specific navigation (hamburger menus, bottom tabs), and touch-specific interactions before writing page objects.

## Final test authoring

Use `playwright-cli` to explore flows, inspect elements, and capture rough actions.

For final test files in this repository, follow the canonical repo skills instead:

- **Prompt templates and file placement** [.claude/skills/common-tasks/SKILL.md](../common-tasks/SKILL.md)
- **Test structure, imports, and tags** [.claude/skills/test-standards/SKILL.md](../test-standards/SKILL.md)
- **Fixture usage and dependency injection** [.claude/skills/fixtures/SKILL.md](../fixtures/SKILL.md)
- **Selector policy** [.claude/skills/selectors/SKILL.md](../selectors/SKILL.md)

## Specific tasks

- **Request mocking** [references/request-mocking.md](references/request-mocking.md)
- **Running Playwright code** [references/running-code.md](references/running-code.md)
- **Browser session management** [references/session-management.md](references/session-management.md)
- **Storage state (cookies, localStorage)** [references/storage-state.md](references/storage-state.md)
- **Tracing** [references/tracing.md](references/tracing.md)
- **Video recording** [references/video-recording.md](references/video-recording.md)

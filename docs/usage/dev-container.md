# Dev Container Guide

**Audience:** Jr QA Engineers — no Docker experience required.

The Dev Container gives you a fully configured development environment inside VS Code — Node.js, Playwright browsers, all dependencies, and every VS Code extension — without installing anything on your machine beyond Docker and VS Code itself. If it works for you, it works for everyone, identically.

---

## Table of Contents

1. [What is a Dev Container?](#1-what-is-a-dev-container)
2. [Prerequisites](#2-prerequisites)
3. [First-Time Setup](#3-first-time-setup)
4. [What Happens Automatically](#4-what-happens-automatically)
5. [Inside the Container — Daily Use](#5-inside-the-container--daily-use)
6. [Running Tests](#6-running-tests)
7. [Port Forwarding — Accessing the App](#7-port-forwarding--accessing-the-app)
8. [Opening a Terminal Inside the Container](#8-opening-a-terminal-inside-the-container)
9. [Stopping and Restarting the Container](#9-stopping-and-restarting-the-container)
10. [Rebuilding the Container](#10-rebuilding-the-container)
11. [Understanding Named Volumes](#11-understanding-named-volumes)
12. [Environment Variables](#12-environment-variables)
13. [VS Code Extensions Auto-Installed](#13-vs-code-extensions-auto-installed)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What is a Dev Container?

Think of a Dev Container as a **pre-built workshop** that ships with every tool already installed and configured. Instead of spending hours installing Node.js, Playwright, browsers, and extensions — and then debugging why it works differently on your colleague's machine — you open this workshop and everything is ready to go.

Technically, a Dev Container is a Docker container that VS Code connects to as your development environment. You edit files, run commands, and see test results just like you would locally — but everything runs inside this container, which is identical for every developer on the team.

**Why use it?**

- No manual installation of Node.js, Playwright, or browsers
- Same environment on Windows, macOS, and Linux
- Extensions (ESLint, Prettier, Playwright Test) are pre-configured
- You cannot accidentally break your machine's global Node.js installation
- New team members are productive in minutes, not hours

---

## 2. Prerequisites

You need three things installed on your machine before you can use the Dev Container. You only do this once.

### Step 1 — Install Docker Desktop

Docker Desktop is the engine that runs the container.

1. Go to [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Download the version for your operating system (Windows, macOS, or Linux)
3. Run the installer and follow the prompts
4. After installation, start Docker Desktop from your Applications or Start Menu
5. Wait for the Docker whale icon to appear in your system tray/menu bar and show "Docker Desktop is running"

> **Windows users:** During Docker Desktop installation you may be prompted to enable WSL 2 (Windows Subsystem for Linux). Accept this — it makes containers run much faster on Windows.

### Step 2 — Install VS Code

If you do not already have VS Code:

1. Go to [https://code.visualstudio.com](https://code.visualstudio.com)
2. Download and install it for your operating system

### Step 3 — Install the Dev Containers Extension

1. Open VS Code
2. Click the Extensions icon in the left sidebar (it looks like four squares)
3. Search for **Dev Containers**
4. Click **Install** on the extension published by Microsoft (identifier: `ms-vscode-remote.remote-containers`)

That is all you need. You do not need to install Node.js, npm, or Playwright on your machine.

---

## 3. First-Time Setup

### Step 1 — Clone the repository

Open a terminal on your machine (not inside VS Code) and run:

```bash
git clone <repository-url>
cd playwright-ai-test-framework
```

### Step 2 — Open the folder in VS Code

```bash
code .
```

Or open VS Code first, then use **File → Open Folder** and select the `playwright-ai-test-framework` folder.

### Step 3 — Reopen in Container

VS Code will detect the `.devcontainer/` folder and show a blue notification in the bottom-right corner:

> **"Folder contains a Dev Container configuration file. Reopen folder to develop in a container."**

Click **Reopen in Container**.

If you missed the notification:

1. Press `F1` (or `Ctrl+Shift+P` / `Cmd+Shift+P`) to open the Command Palette
2. Type `Dev Containers: Reopen in Container`
3. Press Enter

### Step 4 — Wait for the build to complete

The first time you open the container, Docker needs to:

1. Download the Playwright base image (~1 GB — this can take a few minutes depending on your internet speed)
2. Build the custom image on top of it
3. Run the post-create setup script

A progress notification appears in the bottom-right of VS Code. Click it to watch the build log in real time. You will see messages like:

```
=== Post-create: Installing dependencies ===
=== Post-create: Building Smart Reporter ===
=== Post-create: Installing Playwright CLI browsers ===
=== Post-create: Setting up environment ===
=== Dev Container setup complete! ===
Run 'npm test' to execute tests.
```

When you see "Dev Container setup complete!" the container is ready.

> **Subsequent opens are fast.** After the first build, Docker caches everything. Opening the container again takes under 30 seconds.

---

## 4. What Happens Automatically

When the container starts for the first time, VS Code runs `.devcontainer/post-create.sh` automatically. Here is what each step does — you do not need to run any of these manually:

### `npm ci --prefer-offline`

Installs all project dependencies listed in `package.json` into `node_modules`. The `--prefer-offline` flag uses the pre-warmed npm cache baked into the Docker image, so this is faster than a normal `npm install`.

### `npm run build:smart-reporter`

Compiles the Smart Reporter (the AI-powered test report). This step is required before you can run tests — if the Smart Reporter is not built, the test runner will exit with an error before tests start.

### `bash scripts/install-playwright-cli-browsers.sh`

Installs the Chromium browser used by the `playwright-cli` exploration tool. This is separate from the browsers used by `npm test` (those come pre-installed in the Docker base image).

### Environment file creation

If `env/.env.dev` does not exist, the script copies `env/.env.example` to `env/.env.dev` for you. This file contains the local application URLs and credentials needed to run tests.

### `.auth/app/` directory

Creates the directory where authentication storage state files are saved after login setup runs. Playwright writes login session cookies here so tests do not need to log in on every run.

---

## 5. Inside the Container — Daily Use

Once the container is running, VS Code works almost exactly the same as when you are working locally. The key differences:

| What                    | Behaviour inside the container                                                       |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **Terminal**            | Opens inside the container — commands run in Linux, not your local machine           |
| **File edits**          | Changes are reflected on your local machine immediately (files are shared)           |
| **Node.js / npm**       | The container's Node.js **22.22.2** is used — not anything installed on your machine |
| **Playwright browsers** | Pre-installed in `/ms-playwright` — `npm test` uses them automatically               |
| **Extensions**          | Playwright, ESLint, and Prettier are pre-installed and pre-configured                |
| **Git**                 | Works normally — commits from inside the container appear in your local repo         |

---

## 6. Running Tests

All the standard test commands work inside the container terminal exactly as described in the README:

```bash
# Run all tests (Chromium, 4 workers)
npm test

# Run smoke tests only
npm run test:smoke

# Run a single spec file
npx playwright test tests/coffee-cart/functional/login.spec.ts --project=chromium

# Run tests in headed mode (you will see the browser window inside the container)
npx playwright test tests/coffee-cart/functional/menu.spec.ts --project=chromium --headed
```

> **Note on headed mode:** When running headed inside the container, you will see the browser window appear as a virtual display. If you cannot see a window, your Docker Desktop configuration may not support display forwarding. In that case, run headed tests locally without the Dev Container.

After `npm test` completes, the Smart Reporter opens automatically in your default browser. If a browser tab does not open, run:

```bash
npm run report:smart
```

---

## 7. Port Forwarding — Accessing the App

The Dev Container automatically forwards two ports from inside the container to your local machine:

| Port | Service                     | Local URL             |
| ---- | --------------------------- | --------------------- |
| 5273 | Coffee Cart Vite dev server | http://localhost:5273 |
| 3002 | Coffee Cart API server      | http://localhost:3002 |

This means that if the Coffee Cart app is running inside the container (or on your host machine), you can open `http://localhost:5273` in your local browser and see it normally.

> **Starting the Coffee Cart app:** The Coffee Cart app lives in the separate `coffee-cart/` repository. Start it from that directory **on your local machine** (not inside the container) with `npm start`. Port forwarding means the container can reach it at `localhost:5273` and `localhost:3002`.

---

## 8. Opening a Terminal Inside the Container

Every terminal you open inside VS Code while the Dev Container is active runs inside the container.

**To open a terminal:**

- Press `` Ctrl+` `` (or `` Cmd+` `` on macOS)
- Or use **Terminal → New Terminal** from the menu bar

You will see a prompt like:

```
pwuser@abc123:/workspace$
```

The `pwuser` is the non-root user the container runs as. `/workspace` is the project root. This is normal.

**To confirm you are inside the container:**

```bash
echo $DEVCONTAINER
# Output: true
```

---

## 9. Stopping and Restarting the Container

### Stopping

Close the VS Code window. The container stops automatically when VS Code disconnects. Your work is saved — file changes are on your local machine.

### Restarting

Open the project folder in VS Code. VS Code remembers you were using the Dev Container and will show the option to reopen in container, or do so automatically. The container starts in seconds (no re-download or re-build needed).

### Switching back to local development

If you need to work locally without the container:

1. Press `F1` and type `Dev Containers: Reopen Folder Locally`
2. Press Enter

VS Code reopens the same folder on your local machine.

---

## 10. Rebuilding the Container

You need to rebuild the container when:

- The `Dockerfile` changes (someone updated the base image version)
- The `devcontainer.json` changes (new extensions or settings were added)
- Your container is in a broken state and you want to start fresh

**To rebuild:**

1. Press `F1` and type `Dev Containers: Rebuild Container`
2. Press Enter
3. Wait for the build to complete (same as first-time setup, but faster due to Docker layer caching)

> **Rebuilding does not delete your files.** Your code, test results, and uncommitted changes are all on your local machine and are unaffected.

**To rebuild from scratch (no cache):**

1. Press `F1` and type `Dev Containers: Rebuild Container Without Cache`
2. Use this only if a normal rebuild does not fix the problem — it re-downloads the base image and takes longer.

---

## 11. Understanding Named Volumes

The Dev Container uses two Docker named volumes to store large, reusable data outside the main container filesystem:

### `pw-ai-node_modules` → `/workspace/node_modules`

All npm packages are stored in a Docker volume instead of your local filesystem. This avoids a known performance problem on Windows and macOS where reading thousands of small files from a bind-mounted folder (your local machine) is very slow inside Docker.

**What this means for you:**

- `node_modules` inside the container is fast
- You cannot browse `node_modules` in the VS Code Explorer on your local machine — it lives inside the volume
- If you run `npm install` for a new package inside the container, it installs into the volume — it is not visible locally, but that is fine

### `pw-ai-cli-browsers` → `/ms-playwright-cli`

The Chromium browser used by the `playwright-cli` exploration tool is stored in a separate volume. This browser is different from the browsers used by `npm test` (those come pre-installed in the Docker base image at `/ms-playwright`).

**Why two separate browser locations?**

`playwright-cli` bundles its own version of Playwright, which may differ from the version `@playwright/test` uses. Keeping them in separate locations prevents version conflicts.

---

## 12. Environment Variables

The following environment variables are set automatically inside the container:

| Variable                       | Value                | Purpose                                             |
| ------------------------------ | -------------------- | --------------------------------------------------- |
| `DEVCONTAINER`                 | `true`               | Tells scripts they are running inside the container |
| `PLAYWRIGHT_BROWSERS_PATH`     | `/ms-playwright`     | Where `npm test` looks for Chromium/Firefox/WebKit  |
| `PLAYWRIGHT_CLI_BROWSERS_PATH` | `/ms-playwright-cli` | Where `playwright-cli` looks for its Chromium       |

You do not need to set these yourself — `devcontainer.json` configures them automatically.

Application-specific variables (URLs, credentials) come from `env/.env.dev`, which the post-create script creates for you if it does not already exist.

---

## 13. VS Code Extensions Auto-Installed

These extensions are installed automatically inside the container. You do not need to install them yourself:

| Extension       | What it does                                                                        |
| --------------- | ----------------------------------------------------------------------------------- |
| Playwright Test | Run and debug individual tests from the Testing sidebar, see inline pass/fail marks |
| ESLint          | Highlights code rule violations as you type; auto-fixes on save                     |
| Prettier        | Formats your code consistently on every save                                        |

**Editor settings applied automatically:**

- **Format on save** — Prettier runs every time you save a file
- **ESLint fix on save** — ESLint auto-fixes any fixable lint issues when you save

---

## 14. Troubleshooting

### "Docker is not running"

Docker Desktop must be running before VS Code can start the container.

1. Open Docker Desktop from your Applications or Start Menu
2. Wait for the whale icon to show "Docker Desktop is running"
3. Try reopening the container in VS Code

---

### "bash\r: No such file or directory" or CRLF errors on Windows

Git on Windows may convert line endings in shell scripts from Unix format (`LF`) to Windows format (`CRLF`). Shell scripts inside the Linux container cannot run with Windows line endings.

**Fix:**

```bash
# Run this in a local terminal (not inside the container)
git config core.autocrlf false
rm scripts/*.sh .devcontainer/Dockerfile .devcontainer/post-create.sh
git checkout -- scripts/ .devcontainer/
```

Then rebuild the container (`F1 → Dev Containers: Rebuild Container`).

---

### Container builds but tests fail immediately

The most common cause is that the Coffee Cart application is not running.

1. Open a terminal **on your local machine** (not inside the container)
2. Navigate to the `coffee-cart/` directory
3. Run `npm start`
4. Wait until you see the app is running on port 5273 and the API on port 3002
5. Run your tests again inside the container

---

### "Smart Reporter build is required" error before tests

The post-create script should have built the Smart Reporter automatically. If it did not:

```bash
npm run build:smart-reporter
```

Run this once inside the container terminal, then try your tests again.

---

### `node_modules` seems missing or packages are not found

The `node_modules` volume may not have been populated correctly.

```bash
npm ci
```

Run this inside the container terminal. It reinstalls all packages into the volume.

---

### Container is very slow to start or responds slowly

On Windows, make sure WSL 2 is enabled in Docker Desktop settings (**Settings → General → Use the WSL 2 based engine**). WSL 2 gives containers near-native Linux performance.

---

### I want to delete the container and start completely fresh

1. Press `F1` → `Dev Containers: Rebuild Container Without Cache`

Or, to also delete the named volumes (this re-installs all npm packages from scratch):

1. Open Docker Desktop
2. Go to **Volumes**
3. Delete `pw-ai-node_modules` and `pw-ai-cli-browsers`
4. Rebuild the container

> Your code files are never stored in Docker volumes — they live on your local machine. Deleting volumes only removes installed packages and browsers, not your work.

---

## See Also

- [Docker Usage Guide](docker-usage.md) — What Docker is, how the CI pipeline uses it, and how the Playwright image is built
- [Framework Onboarding](../framework-onboarding.md) — First steps for running the test suite for the first time
- [Scripts Reference Guide](scripts-usage.md) — All `npm run` commands explained

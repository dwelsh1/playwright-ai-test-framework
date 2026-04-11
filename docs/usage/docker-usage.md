# Docker Usage Guide

**Audience:** Jr QA Engineers — no Docker experience required.

This guide explains what Docker is, why this framework uses it, and how it fits into the CI pipeline. You will not need to run Docker commands in your day-to-day testing work — but understanding what Docker does helps you make sense of CI logs, pipeline failures, and environment differences.

---

## Table of Contents

1. [What is Docker?](#1-what-is-docker)
2. [Key Terms You Will See](#2-key-terms-you-will-see)
3. [The Playwright Docker Image](#3-the-playwright-docker-image)
4. [Why Docker for CI?](#4-why-docker-for-ci)
5. [The Framework's Dockerfile Explained](#5-the-frameworks-dockerfile-explained)
6. [How GitHub Actions Uses Docker](#6-how-github-actions-uses-docker)
7. [How CircleCI Uses Docker](#7-how-circleci-uses-docker)
8. [What Runs in Docker vs What Runs Locally](#8-what-runs-in-docker-vs-what-runs-locally)
9. [Reading Docker-Related CI Logs](#9-reading-docker-related-ci-logs)
10. [Common Questions](#10-common-questions)

---

## 1. What is Docker?

Imagine you are shipping a piece of furniture. You can put all the parts, screws, instructions, and tools into one sealed box. Anyone who receives that box gets exactly the same contents — they do not need to source their own screws or tools.

Docker does the same thing for software. It bundles an application with its operating system, runtime, dependencies, and configuration into a single sealed package called a **container**. That container runs identically on any machine that has Docker installed — your laptop, your colleague's laptop, a CI server in the cloud.

**Before Docker**, teams would say "it works on my machine" because each developer's environment was slightly different — different Node.js versions, different browser versions, missing dependencies. CI servers might have a completely different OS or library versions.

**With Docker**, the environment is defined once in a file (the `Dockerfile`) and reproduced exactly everywhere it runs.

---

## 2. Key Terms You Will See

| Term           | Plain English explanation                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Image**      | A snapshot of a pre-configured environment. Like a template or a master copy. Read-only.                                                                                                |
| **Container**  | A running instance of an image. Like a copy made from the template that is now actually running. You can have many containers from the same image.                                      |
| **Dockerfile** | A text file with step-by-step instructions for building an image. Like a recipe.                                                                                                        |
| **Registry**   | A place where images are stored and downloaded from. Like an app store for Docker images. The most common is Docker Hub. Microsoft has their own at `mcr.microsoft.com`.                |
| **Volume**     | Storage that exists outside the container's filesystem and persists when the container is stopped or recreated. Useful for things like `node_modules` that are expensive to rebuild.    |
| **Layer**      | Each instruction in a Dockerfile creates a layer. Docker caches layers, so if only the last instruction changed, only that layer is rebuilt — not everything. This makes builds faster. |
| **Tag**        | A version label on an image. For example, `playwright:v1.58.0-noble` — `v1.58.0` is the Playwright version and `noble` is the Ubuntu codename the image is based on.                    |

---

## 3. The Playwright Docker Image

The framework uses the official Microsoft Playwright image:

```
mcr.microsoft.com/playwright:v1.58.0-noble
```

This image is maintained by the Playwright team and comes pre-configured with everything needed to run Playwright tests:

- **Ubuntu 24.04 LTS** ("Noble Numbat") as the operating system
- **Node.js** pre-installed
- **Chromium, Firefox, and WebKit** browsers pre-installed in `/ms-playwright`
- All system dependencies these browsers need (fonts, codecs, libraries)
- No graphical display required — browsers run in headless mode by default

**Why does this matter?** Installing Playwright browsers on a fresh Linux server normally requires dozens of system libraries. The Playwright image ships with all of them already installed. This is why CI pipelines do not need a separate "install browsers" step.

---

## 4. Why Docker for CI?

CI pipelines (GitHub Actions, CircleCI) run tests automatically when code is pushed. Without Docker, each CI run would need to:

1. Set up a Linux machine
2. Install Node.js at the right version
3. Install system libraries for browsers
4. Install Playwright browsers
5. Finally run tests

That process is slow (5-10 minutes of setup), fragile (library versions drift), and inconsistent (CI may use a different Ubuntu version next month).

With Docker, the CI runner simply pulls the Playwright image and runs tests inside it. The environment is the same every single time — same browser versions, same system libraries, same OS. If a test passes locally in the container, it passes in CI.

**Additional benefits:**

- **Isolation** — tests in one CI job cannot interfere with another
- **Speed** — pulling a cached image is faster than installing everything from scratch
- **Reproducibility** — you can reproduce any CI failure locally by running the same image
- **Version pinning** — the image tag (`v1.58.0-noble`) pins the exact browser versions; upgrading is a deliberate change in the `Dockerfile`

---

## 5. The Framework's Dockerfile Explained

The framework's `Dockerfile` is at `.devcontainer/Dockerfile`. This file is used to build the Dev Container image (the local development environment). The CI pipeline uses the upstream `mcr.microsoft.com/playwright` image directly without this Dockerfile.

Here is the full file with each section explained:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.58.0-noble
```

**Start from the official Playwright image.** Everything already in that image — Ubuntu, Node.js, browsers — is inherited automatically. This is called the "base image".

---

```dockerfile
ARG USERNAME=pwuser
ARG USER_UID=1000
ARG USER_GID=$USER_UID
```

**Define build arguments** for the non-root user that will be created. `ARG` values are only used during the image build — they are not environment variables at runtime.

---

```dockerfile
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && apt-get update \
    && apt-get install -y sudo \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
```

**Create a non-root user called `pwuser`.** Running containers as root is a security risk. This step creates a regular user (`pwuser`) with sudo access (so it can install things if needed). The `apt-get clean` removes cached package files to keep the image size small.

---

```dockerfile
COPY package.json package-lock.json /tmp/build/
RUN cd /tmp/build && npm ci --prefer-offline --ignore-scripts \
    && cp -r /root/.npm /home/$USERNAME/.npm \
    && chown -R $USERNAME:$USERNAME /home/$USERNAME/.npm \
    && rm -rf /tmp/build
```

**Pre-warm the npm cache.** This copies the `package.json` and `package-lock.json` into a temporary build directory, runs `npm ci` to populate the npm cache at `~/.npm`, then copies that cache to the `pwuser` home directory, and cleans up. The result: when the post-create script later runs `npm ci --prefer-offline`, it finds all packages already cached and installs in seconds instead of minutes.

This works because of Docker layer caching — this step only re-runs if `package.json` or `package-lock.json` changes.

---

```dockerfile
RUN mkdir -p /ms-playwright-cli \
    && chown -R $USERNAME:$USERNAME /ms-playwright-cli
```

**Create and own the `playwright-cli` browser directory.** The `playwright-cli` tool (used for page exploration) stores its Chromium at `/ms-playwright-cli`. Creating it here with the right ownership means the `pwuser` can write to it without needing root.

---

```dockerfile
WORKDIR /workspace
```

**Set the default working directory** inside the container. When you open a terminal in VS Code, you start here.

---

```dockerfile
USER $USERNAME
```

**Switch to the non-root user** for all subsequent commands (and for the running container). Everything from this point runs as `pwuser`.

---

## 6. How GitHub Actions Uses Docker

The GitHub Actions workflow at `.github/workflows/playwright.yml` uses Docker for all test jobs. Here is how the `smoke` job is configured:

```yaml
smoke:
  name: Smoke Tests (Sauce Demo)
  runs-on: ubuntu-latest
  container:
    image: mcr.microsoft.com/playwright:v1.58.0-noble
```

**`runs-on: ubuntu-latest`** — GitHub spins up a fresh Ubuntu virtual machine.

**`container: image: mcr.microsoft.com/playwright:v1.58.0-noble`** — Inside that VM, GitHub pulls the Playwright image and runs all subsequent steps inside that container. The VM acts as the host; the Playwright image is the environment where your tests actually run.

The steps that follow are standard — checkout code, install packages, run tests — but they all execute inside the Playwright container, not on the bare Ubuntu VM.

### The workflow jobs and what they do

| Job             | When it runs                              | What it does                                                                  |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `lint`          | Every push, PR, and schedule              | Runs ESLint on all TypeScript files — no Docker image needed                  |
| `smoke`         | Every push, PR, and schedule (after lint) | Runs the **`sauce-demo`** project against the public demo site (no local app) |
| `regression`    | Pushes to `main` and nightly only         | Coffee Cart suite in Chromium, 4 shards; clones and starts Coffee Cart in CI  |
| `quarantine`    | Pushes to `main` and nightly only         | Runs `@flaky` tagged tests with 3 retries                                     |
| `merge-reports` | After regression, **not** on PRs          | Merges blob reports into HTML + JSON (skipped when regression does not run)   |

### Sharding

The `regression` job runs 4 copies in parallel (shards 1/4, 2/4, 3/4, 4/4). Each shard runs a quarter of the tests in its own Docker container simultaneously. This cuts the total test time to roughly one-quarter of what it would take to run all tests sequentially.

---

## 7. How CircleCI Uses Docker

The CircleCI configuration at `.circleci/config.yml` uses Docker similarly, but with CircleCI's own syntax:

```yaml
smoke-tests:
  docker:
    - image: mcr.microsoft.com/playwright:v1.58.0-noble
```

The `docker:` key tells CircleCI to run this job inside the specified Docker image. The same Playwright image is used as in GitHub Actions — test results will be identical.

### The CircleCI jobs

| Job                | When it runs                    | What it does                                   |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| `lint`             | Every push and PR               | ESLint check using a lightweight Node.js image |
| `smoke-tests`      | Every push and PR (after lint)  | Smoke tests in Chromium                        |
| `regression-tests` | Nightly at 2 AM UTC (on `main`) | Full regression with 4-way parallel sharding   |
| `quarantine-tests` | Nightly at 2 AM UTC (on `main`) | `@flaky` tests with retries                    |

### JUnit test results

CircleCI uses the `store_test_results` step to ingest JUnit XML from `test-results/`. This feeds into CircleCI's built-in test analytics — you can see pass rates and slowest tests in the CircleCI dashboard.

---

## 8. What Runs in Docker vs What Runs Locally

| Scenario                             | Where it runs        | Docker involved?             |
| ------------------------------------ | -------------------- | ---------------------------- |
| `npm test` on your machine           | Your local machine   | No (unless Dev Container)    |
| `npm test` inside the Dev Container  | Docker container     | Yes — Dev Container image    |
| CI smoke tests (GitHub Actions)      | Docker container     | Yes — Playwright image       |
| CI regression tests (GitHub Actions) | Docker containers×4  | Yes — one per shard          |
| CI smoke tests (CircleCI)            | Docker container     | Yes — Playwright image       |
| CI lint job                          | Bare VM / Node image | Lightweight or no Playwright |

---

## 9. Reading Docker-Related CI Logs

When a CI job fails, you may see Docker-specific messages in the logs. Here is what common ones mean:

### "Unable to pull image"

```
Error: failed to pull image mcr.microsoft.com/playwright:v1.58.0-noble
```

The CI runner could not download the Docker image. Usually a temporary network issue — re-running the pipeline fixes it.

---

### "Container exited with code 1"

The Docker container started but a command inside it failed. Look at the step that preceded this message — the test runner, the build step, or `npm ci` — for the actual error.

---

### "Waiting for application to be ready..."

```
Waiting for application to be ready...
curl: (7) Failed to connect to localhost port 3002
```

The **regression** and **quarantine** jobs curl the Coffee Cart API before tests. If you see this and a failure, the API (or Vite) did not start in that job — check the Coffee Cart install/start steps, `APP_URL` / `API_URL`, and logs under `/tmp/coffee-cart-*.log`. The **smoke** job does not wait on localhost; it targets the public Sauce Demo site.

---

### "Browser not found" or "Executable doesn't exist"

If you see this in CI, it usually means the tests are not using the Playwright image (they are running on a bare VM without browsers installed), or `PLAYWRIGHT_BROWSERS_PATH` is not set correctly. In the Dev Container, this is handled automatically.

---

## 10. Common Questions

### Do I need to know Docker commands to use this framework?

No. For day-to-day test writing, you only need to open the Dev Container in VS Code and run the npm commands in the README. Docker runs in the background.

The two situations where you might type a Docker command:

- Deleting named volumes to start fresh (see [Dev Container Guide — Troubleshooting](dev-container.md#14-troubleshooting))
- Checking which containers are running: `docker ps`

---

### Why does the Dev Container use a custom Dockerfile instead of just the Playwright image?

The custom `.devcontainer/Dockerfile` adds things the Playwright image does not have by default:

- A non-root user (`pwuser`) for security
- A pre-warmed npm cache so `npm ci` runs in seconds
- The correct directory structure for named volumes

For CI jobs, these extras are not needed — the CI runner handles user accounts and caching differently — so CI uses the upstream Playwright image directly.

---

### What is the difference between the image version and the Playwright version?

The image tag `v1.58.0-noble` means:

- **`v1.58.0`** — the version of `@playwright/test` and the browsers bundled in the image
- **`noble`** — Ubuntu 24.04 LTS ("Noble Numbat")

The `@playwright/test` version in `package.json` should match the image version. If they drift apart, browser APIs may differ and tests may behave unexpectedly.

---

### Can I run the Playwright Docker image locally without VS Code?

Yes, though you rarely need to. This is useful for reproducing a CI failure exactly:

```bash
# Pull the same image CI uses
docker pull mcr.microsoft.com/playwright:v1.58.0-noble

# Run a container with the current directory mounted
docker run --rm -it \
  -v $(pwd):/workspace \
  -w /workspace \
  mcr.microsoft.com/playwright:v1.58.0-noble \
  bash
```

Inside that shell, run `npm ci && npm test` to reproduce the CI environment exactly.

---

### How do I upgrade the Playwright version?

Upgrading requires changing the version in three places:

1. **`package.json`** — update `@playwright/test` version
2. **`.devcontainer/Dockerfile`** — update the `FROM` line image tag
3. **`.github/workflows/playwright.yml`** and **`.circleci/config.yml`** — update the `image:` references

After changing these, run `npm install` to update `package-lock.json`, then rebuild the Dev Container and run the full test suite to confirm nothing broke.

---

## See Also

- [Dev Container Guide](dev-container.md) — Step-by-step instructions for setting up and using the VS Code Dev Container
- [CI/CD skill](./.claude/skills/ci-cd/SKILL.md) — Detailed CI pipeline patterns for GitHub Actions and CircleCI
- [Framework Onboarding](../framework-onboarding.md) — First-time setup for running tests locally

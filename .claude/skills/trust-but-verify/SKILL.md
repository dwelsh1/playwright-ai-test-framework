---
name: trust-but-verify
description: Verify that a frontend feature branch matches its intended scope by reviewing the branch diff, PR description, and any user-provided requirements, then performing live browser checks with `playwright-cli`. Use after implementing UI changes, before merging a feature branch, before demos, or when a user-visible change needs manual verification against actual behavior.
---

# Trust But Verify

Use this skill to confirm that a UI-facing branch actually matches its intended behavior in the running app.

Core idea: requirements describe intent, diffs show implementation, and the browser shows reality. This skill compares all three before a branch is considered done.

## Use This Skill When

- The branch changes frontend behavior, UI flows, or user-visible content
- The user has described expected behavior in a PR, issue, requirements note, or chat prompt
- The user wants pre-merge verification, demo readiness, or manual QA against the intended UX

## Do Not Use This Skill When

- The work is backend-only, API-only, or config-only
- No meaningful user-visible behavior changed
- The user is asking you to fix code rather than verify it

## Repo-Specific Rules

- Read `.claude/skills/playwright-cli/SKILL.md` before any browser work
- Use `playwright-cli` for browser verification in this repo
- Never hardcode credentials
- Never save secrets into the repository
- Never start services without first checking reachability and asking permission
- Never modify application code while using this skill
- Stay scoped to the requested behavior and changed files

## Inputs To Gather

Collect these before browser work:

1. The most relevant requirements source available
2. The current branch name
3. The diff versus the base branch
4. Any PR description if one exists
5. The app under test and its local URL

Use the repo itself as the source of truth:

- Requirements source: PR description, issue text, acceptance notes, relevant docs, or user-provided expectations
- Branch and diff: `git`
- PR context: `gh pr view`
- App URLs and behavior: `config/`, `playwright.config.ts`, `README.md`, `docs/`
- Auth clues: `.auth/`, `env/.env.example`, docs, or user-provided credentials

## Workflow

### 1. Gather Context

Find the most relevant source of expected behavior by topic, filenames, nearby app area, PR description, issue text, or user prompt. Do not rely on branch name alone if the changed files make the target clearer.

Read:

- the most relevant requirements source available
- `git diff` for the branch
- recent commits if helpful
- PR body if a PR exists

Then produce a verification checklist with:

- pages or routes to visit
- UI elements to confirm
- happy path interactions to perform
- edge cases to exercise
- error states to trigger
- responsive checks needed for changed pages only

Keep the checklist focused on what changed plus adjacent user-visible impact.

### 2. Preflight

Determine the local app URL from repo configuration or documentation. Prefer existing repo sources before asking the user.

Check whether the app is reachable before opening the browser.

If unreachable:

- tell the user which URL was checked
- ask whether they want to start it or want you to start it
- do not proceed until the app is reachable

Create output folders if needed:

- `docs/verification/`
- `docs/verification/screenshots/<branch-slug>/`

### 3. Browser Verification

Before browser work, read the `playwright-cli` skill and follow it.

Use `playwright-cli` to:

- open the app
- navigate to each relevant page
- inspect the live page structure
- perform the planned interactions
- capture screenshots at important states

Authentication rules:

- If existing auth state or local credentials are already documented and safe to use, use them
- Otherwise ask the user for credentials or for help completing login
- Never commit credentials or write them into repo files

For each checklist item:

1. Navigate to the page or route
2. Confirm the expected elements are present
3. Perform the happy path interaction
4. Check the expected outcome
5. Exercise relevant edge cases and error states
6. Record PASS, CONCERN, FAIL, or OUT-OF-SCOPE

Responsive checks:

- Only run them for pages materially changed by the branch
- Check at least desktop, tablet, and mobile widths
- Capture screenshots when layout or behavior differs meaningfully

If an interaction cannot be completed after a few evidence-based attempts:

- record the blocker
- capture a screenshot if useful
- move on instead of thrashing

### 4. Write The Report

Write a report to:

- `docs/verification/YYYY-MM-DD-<branch-slug>.md`

Use the template in [report-template.md](report-template.md).

The report must include:

- requirements reference or source
- branch name
- PR link if available
- summary counts for PASS, CONCERN, FAIL, and OUT-OF-SCOPE
- concrete findings tied to expected behavior
- screenshot paths when captured

### 5. Return A Short Summary

In chat, provide:

- summary counts
- each FAIL item in one line
- notable concerns
- the report path

## Recommended Commands

Use these as a starting point and adapt as needed:

```bash
git branch --show-current
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- "pages/**" "tests/**" "config/**" "docs/**"
gh pr view --json title,body,url
```

Reachability check example:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5273
```

Create report folders:

```bash
mkdir -p docs/verification
mkdir -p docs/verification/screenshots/<branch-slug>
```

## Reporting Standards

- Verify behavior, not implementation details
- Prefer user-visible outcomes over DOM trivia
- Distinguish broken behavior from missing polish
- Call out requirement mismatches explicitly
- Mark unrelated observations as OUT-OF-SCOPE instead of inflating failures

## Red Flags

- Do not skip the reachability check
- Do not use browser MCP tools for this repo's verification flow
- Do not silently broaden scope beyond the requested behavior and diff
- Do not make code edits while in verification mode
- Do not hide uncertainty; record it as a concern

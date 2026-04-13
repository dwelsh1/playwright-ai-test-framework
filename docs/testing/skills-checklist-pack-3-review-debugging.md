# Pack 3 — Review and debugging checklist

**Purpose:** Quick manual validation of skills for **code review**, **failure diagnosis**, **error message mapping**, **flake taxonomy**, and **resilient assertions**—without running the full skill matrix from [Skills testing guide](./skills-testing.md).

**Related:** This document is a **curated shortcut** for **Pack 3 — Review and debugging** (`pw-review`, `debugging`, `error-index`, `flaky-tests`, `advanced-assertions`).

**Canonical skills:** `.cursor/skills/{skill-id}/SKILL.md` (GitHub Copilot mirrors: `npm run sync:github-agents`).

---

## Result template

Use one block per skill (fresh chat per row is ideal):

```md
## Skill test result

- Skill:
- Prompt used:
- Expected behavior:
- Actual behavior:
- Verdict: Pass / Partial / Fail
- Notes:
```

---

## 1. Automated smoke (run locally)

From the repo root:

**Agent sync (parses every `.cursor/skills/*/SKILL.md` frontmatter + description):**

```bash
npm run sync:github-agents
```

Expect: `sync-github-agents: wrote 35 file(s)` with no stack trace.

There is **no** Pack-3–specific subset script. Optional: run a small headed/local test repro if you are validating `debugging` or `flaky-tests` with real failures.

---

## 2. Manual checks (five prompts)

| #   | Skill                 | Prompt                                                                                                                                   | Pass if…                                                                                                                                    |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `pw-review`           | Review these **changed Playwright files** for **framework compliance**, **selector quality**, and **regression risk**.                   | **Review-first** (findings before large rewrites); cites selectors, fixtures, tags, or Lean POM where relevant—not silent reimplementation. |
| 2   | `debugging`           | This **Firefox** test is failing **only in CI**. Walk through the framework’s **debugging workflow** and narrow down the **root cause**. | Methodical diagnosis (traces, artifacts, isolation, env diffs); avoids guessing or unrelated refactors.                                     |
| 3   | `error-index`         | I am getting **strict mode violation** on this locator. Use the **error index** approach to explain the likely **cause** and **fix**.    | Maps the message to **likely causes** and **targeted fixes** (strict resolution, locator scope, etc.).                                      |
| 4   | `flaky-tests`         | This **checkout** spec is flaky **across browsers**. Diagnose the likely **flakiness category** and recommend the **cleanest fix**.      | **Classifies** the flake (timing, state, env, data); recommends **root-cause** fixes—not only “increase retries.”                           |
| 5   | `advanced-assertions` | Fix this **flaky dashboard** spec by replacing naive timing assumptions with **polling-based** assertions.                               | Recommends **`expect.poll`**, **`toPass`**, **soft assertions**, or similar—**not** arbitrary `waitForTimeout` as the primary fix.          |

---

## 3. Expanding the pack

Pack 3 in [skills-testing.md](./skills-testing.md) is **fully covered** by the five rows above. For **live UI verification** of a feature branch (requirements + browser), add **`trust-but-verify`** from [Pack 4](./skills-checklist-pack-4-workflow-repo.md).

---

## See also

- [Skills testing guide](./skills-testing.md) — methodology, negative tests
- [Pack 1 — Lean POM checklist](./skills-checklist-pack-1-lean-pom.md) — includes a focused `pw-review` row
- [Pack 2 — API and type safety](./skills-checklist-pack-2-api-type-safety.md)
- [Pack 4 — Workflow and repo operations](./skills-checklist-pack-4-workflow-repo.md)
- [Menu skill test walkthrough](./menu-skill-test-walkthrough.md) — `pw-review` second pass with Coffee Cart paths
- [Sauce Demo skill test walkthrough](./sauce-demo-skill-test-walkthrough.md)
- [Skills usage guide](../usage/skills-guide.md)
- [Skill prompt examples](../usage/skill-prompt-examples.md)

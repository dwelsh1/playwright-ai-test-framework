# Pack 1 — Lean POM subset checklist

**Purpose:** Quick manual validation of a **small subset** of skills that matter most for **Lean POM** and UI authoring, without running all 35 skills.

**Related:** See [Skills testing guide](./skills-testing.md) for full methodology, all packs, and negative tests. This document is a **curated shortcut** derived from **Pack 1 — New UI test authoring** (plus `pw-review`), with prompts aligned to **Lean POM** wording.

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

**A. Agent sync (parses every `.cursor/skills/*/SKILL.md` frontmatter + description):**

```bash
npm run sync:github-agents
```

Expect: `sync-github-agents: wrote 35 file(s)` with no stack trace.

**B. Subset body checks (frontmatter + `Lean POM` in body where we standardize terminology):**

```bash
node scripts/verify-skills-subset.mjs
```

Expect: six lines starting with `OK`, exit code `0`. The script lives at `scripts/verify-skills-subset.mjs` so it runs the same on Windows, macOS, and Linux (no fragile `node -e` quoting).

---

## 2. Manual checks (six prompts)

| #   | Skill            | Prompt                                                                                                                                                                               | Pass if…                                                                                                                                       |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `page-objects`   | Create a **Lean POM** page object for the Coffee Cart **stores** page using **constructor-assigned readonly locators**, **action methods only**, and **no `expect()` in the class**. | Stays Lean POM-shaped; mentions fixture registration under `fixtures/pom/` (or equivalent merged test options).                                |
| 2   | `selectors`      | Review these locators and replace brittle ones with the framework’s **semantic** strategy (`getByRole` / `getByLabel` first).                                                        | Role/label-first; calls out brittle patterns; for forms, feedback locators / **No Feedback-Less Lean POM** where relevant.                     |
| 3   | `fixtures`       | Add a fixture for the new **orders** page object and register it in the **merged** test options.                                                                                     | `test.extend` / merged fixtures; **playwright-cli** exploration expectation + **No Feedback-Less Lean POM** preconditions before registration. |
| 4   | `test-standards` | Rewrite this functional spec to match our **imports**, **single tag per test**, and **Given/When/Then** steps.                                                                       | Imports from merged `test`; tagging and step conventions from the skill.                                                                       |
| 5   | `pw-review`      | Review these changed Playwright files for **framework compliance**, **Lean POM**, selectors, and regression risk.                                                                    | Review-first (findings before rewrites); cites Lean POM, fixtures, tags where relevant.                                                        |
| 6   | `playwright-cli` | Use **playwright-cli** to explore the **menu** page, then summarize what to automate (do not substitute IDE browser tools for exploration).                                          | CLI-first exploration; does not recommend bypassing `playwright-cli` for UI discovery.                                                         |

**Optional negative check** (from [Skills testing guide](./skills-testing.md) — `playwright-cli` should not trigger):

```text
Review this config diff and tell me whether the retries and reporters make sense.
```

Expected: stays in config/review mode; **no** live page exploration workflow.

---

## 3. Expanding the pack

To match the full **Pack 1** list in [skills-testing.md](./skills-testing.md), also run the same template for:

- `common-tasks`
- `data-strategy`

---

## See also

- [Skills testing guide](./skills-testing.md) — full packs, skill-by-skill table, `skill-creator` sequence
- [Skills usage guide](../usage/skills-guide.md) — when to use which skill
- [Skill prompt examples](../usage/skill-prompt-examples.md) — copy-paste prompts

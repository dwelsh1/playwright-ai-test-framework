# Pack 4 — Workflow and repo operations checklist

**Purpose:** Quick manual validation of skills for **branch verification**, **CI/CD**, **app onboarding**, **migration narrative**, and **skill authoring**—without running the full skill matrix from [Skills testing guide](./skills-testing.md).

**Related:** This document is a **curated shortcut** for **Pack 4 — Workflow and repo operations** (`trust-but-verify`, `ci-cd`, `app-onboarding`, `migration-guides`, `skill-creator`).

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

**CI source of truth:** This repo’s workflow behavior is defined in `.github/workflows/` (see **`ci-cd`** skill and [Developer guide](../developer.md)). Pack 4 manual prompts do not replace reading the YAML when you change pipelines.

---

## 2. Manual checks (five prompts)

| #   | Skill              | Prompt                                                                                                                                                                   | Pass if…                                                                                                                                                       |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `trust-but-verify` | **Verify** that this **frontend branch** matches the intended **UX**, click through the changed flow with **playwright-cli**, and write a **verification report**.       | Treats work as **manual verification** (requirements + diff + browser evidence); not a generic code-only review.                                               |
| 2   | `ci-cd`            | Update our **Playwright pipeline** so **smoke runs on PRs**, **regression sharding runs nightly**, and **traces upload on failure**.                                     | Thinks in **workflow** terms: jobs, sharding, artifacts, reporters, and CI-specific constraints—not only local `npx playwright test` flags.                    |
| 3   | `app-onboarding`   | Help me **onboard a new demo app** into the framework with the right **directory structure**, **fixtures**, **config**, and **starter tests**.                           | Follows the repo’s **multi-app contract** (`tests/{app}/`, `pages/{app}/`, config, fixture registration); references removal/replacement patterns if relevant. |
| 4   | `migration-guides` | **Translate this Cypress test** into our **Playwright framework style** and explain the **architectural changes**, not just the syntax changes.                          | Discusses **migration patterns** (fixtures, locators, async model), not line-only translation.                                                                 |
| 5   | `skill-creator`    | **Create a new repo skill** for **release-readiness verification**, include **eval prompts**, and make the **trigger description** specific enough to activate reliably. | Skill-creation loop: intent, draft **`SKILL.md`**, eval prompts, iteration/trigger tuning—not a normal product feature implementation.                         |

---

## 3. Deep pass for `skill-creator`

After row 5, run the **three-step manual sequence** in [Skills testing guide](./skills-testing.md) → **Manual Test Sequence For `skill-creator`** (creation prompt, improvement prompt, description optimization prompt).

---

## 4. Negative checks (over-triggering)

From [Skills testing guide](./skills-testing.md):

### `trust-but-verify` should not trigger

```text
I updated the API schemas and helper fixtures for the orders endpoint. Can you review the TypeScript changes and tell me if the contracts look correct?
```

Expected: **`pw-review`** / **`type-safety`**-style response; **no** full browser verification report workflow.

### `skill-creator` should not trigger

```text
Create a new functional test for cart discounts.
```

Expected: **`common-tasks`** or authoring skills drive the response; assistant **does not** start designing a new `.cursor/skills/...` skill.

---

## 5. Expanding the pack

Pack 4 in [skills-testing.md](./skills-testing.md) is **fully covered** by the five rows above (plus §3 for `skill-creator` depth). For UI authoring checks, use [Pack 1](./skills-checklist-pack-1-lean-pom.md); for API coverage, use [Pack 2](./skills-checklist-pack-2-api-type-safety.md).

---

## See also

- [Skills testing guide](./skills-testing.md) — full methodology, all packs, negative tests, `skill-creator` sequence
- [Pack 1 — Lean POM checklist](./skills-checklist-pack-1-lean-pom.md)
- [Pack 2 — API and type safety](./skills-checklist-pack-2-api-type-safety.md)
- [Pack 3 — Review and debugging](./skills-checklist-pack-3-review-debugging.md)
- [Menu skill test walkthrough](./menu-skill-test-walkthrough.md)
- [Sauce Demo skill test walkthrough](./sauce-demo-skill-test-walkthrough.md)
- [Skills usage guide](../usage/skills-guide.md)
- [Skill prompt examples](../usage/skill-prompt-examples.md)
- [Skill creator usage](../usage/skill-creator-usage.md)

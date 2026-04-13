# Pack 2 — API and type safety checklist

**Purpose:** Quick manual validation of skills used for **API tests**, **schemas**, **coverage decisions**, and **test data**—without running the full skill matrix from [Skills testing guide](./skills-testing.md).

**Related:** This document is a **curated shortcut** for **Pack 2 — API and type safety** (`api-testing`, `type-safety`, `test-architecture`, `data-strategy`).

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

There is **no** Pack-2–specific subset script (unlike Pack 1’s `verify-skills-subset.mjs`). Optional: run your usual `npm run lint` / targeted API tests if you changed skills that affect generated agent files.

---

## 2. Manual checks (four prompts)

| #   | Skill               | Prompt                                                                                                                                   | Pass if…                                                                                                                          |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `api-testing`       | Create **API tests** for the **orders** endpoint using the **`api` fixture**, **Zod validation**, and **proper step boundaries**.        | Uses `api`, schema validation, and step-based API coverage patterns from the skill; aligns with repo `tests/**/api/` conventions. |
| 2   | `type-safety`       | Refactor this API schema code to **remove any types** and use **strict Zod parsing** throughout.                                         | Emphasizes `z.strictObject()`, strong typing, and TypeScript-safe patterns inferred from schemas—not hand-wavy `any`.             |
| 3   | `test-architecture` | For this **new admin workflow**, tell me which parts should be **API tests** versus **functional tests** versus **one end-to-end path**. | Reasons about **coverage levels** and test types; does not jump straight into a full E2E implementation without a rationale.      |
| 4   | `data-strategy`     | Replace the remaining **hardcoded checkout** values with **factories** or **static JSON** where appropriate.                             | Distinguishes happy-path factory data from invalid/boundary JSON; avoids endorsing unnecessary inline literals.                   |

---

## 3. Expanding the pack

Pack 2 in [skills-testing.md](./skills-testing.md) is **fully covered** by the four rows above. If you are validating adjacent authoring skills, run **Pack 1** ([`skills-checklist-pack-1-lean-pom.md`](./skills-checklist-pack-1-lean-pom.md)) or the skill-by-skill table for `common-tasks`, `enums`, or `config`.

---

## See also

- [Skills testing guide](./skills-testing.md) — methodology, negative tests, `skill-creator` sequence
- [Pack 1 — Lean POM checklist](./skills-checklist-pack-1-lean-pom.md)
- [Pack 3 — Review and debugging](./skills-checklist-pack-3-review-debugging.md)
- [Pack 4 — Workflow and repo operations](./skills-checklist-pack-4-workflow-repo.md)
- [Skills usage guide](../usage/skills-guide.md)
- [Skill prompt examples](../usage/skill-prompt-examples.md)

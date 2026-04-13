# Menu skill test walkthrough

Reproducible sequence for extending Coffee Cart menu coverage while staying aligned with **Lean POM** and framework rules.

For methodology (fresh chat, one main task), see the [Skills testing guide](./skills-testing.md). For more copy-paste examples, see [Skill prompt examples](../usage/skill-prompt-examples.md).

The prompts in this doc **include instructions** for the assistant to paste a filled **Skill test result** section **into the chat** — not appended into this walkthrough or any other repo doc. You may copy that chat block into your own test log (one per skill run is ideal). Treat **Verdict** as the assistant’s self-assessment until you confirm behavior against the skill and the repo.

### Skill test result template (target shape)

```md
## Skill test result

- Skill:
- Prompt used:
- Expected behavior:
- Actual behavior:
- Verdict: Pass / Partial / Fail
- Notes:
```

### Prompt suffix (already baked into each `text` prompt below)

Every fenced prompt below ends with the same closing instructions: **paste into chat** a `## Skill test result` block using the bullet fields above — **do not write that block into this file or other documentation.** If you author a new prompt for this walkthrough, paste this paragraph after your task text:

```text
When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

---

## 1. Explore with `playwright-cli`

1. Start Coffee Cart locally (see [README](../../README.md) — Application Under Test).
2. Open the app and sign in: `npx playwright-cli open http://localhost:5273` (or your configured base URL).
3. Use `playwright-cli snapshot` after navigation to capture roles, lists, banner actions (cart, checkout summary, optional GitHub link), and card structure (headings, prices, ingredient regions vs image-only cards).
4. Do **not** substitute IDE browser MCP or `codegen` for this exploration step (`CLAUDE.md` — No Substitute UI Exploration).

### Prompt to use (skill: `playwright-cli`)

Use a **fresh chat** when validating that this skill triggers on natural language.

```text
Use playwright-cli to explore the Coffee Cart menu page (after sign-in if required). Capture roles, the product grid, header actions (cart, checkout summary, optional GitHub link), and card structure—headings, prices, ingredient areas vs image-only cards. Summarize what we should automate next. Do not substitute IDE browser tools or codegen for this exploration.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

Shorter variant:

```text
Use playwright-cli to explore the menu page, then summarize what to automate (do not substitute IDE browser tools for exploration).

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

---

## 2. Implementation prompts (what to ask for)

Target files (adjust paths if your tree differs):

- `pages/coffee-cart/menu.page.ts`, `pages/components/header.component.ts`
- `tests/coffee-cart/functional/menu.spec.ts`

Rules to keep in the prompt so the assistant stays on **Lean POM**:

- New or updated locators on `MenuPage` / `HeaderComponent`: readonly constructor fields, scoped to the **product grid** (avoid matching nav-only lists).
- Actions only in page objects; assertion and `expect()` only in specs.
- Register nothing in fixtures until the Lean POM shape is complete, including feedback or summary controls the UI exposes (see **No Feedback-Less Lean POM** in `CLAUDE.md`).

### Primary prompt (skill: `page-objects` + related authoring)

```text
Extend Coffee Cart menu coverage using Lean POM. Update or add readonly constructor locators and action methods on MenuPage and HeaderComponent—scope list/card locators to the product grid so we do not match nav-only lists. Put assertions and expect() only in tests/coffee-cart/functional/menu.spec.ts. Do not register new fixtures until the page objects expose the real UI feedback/summary controls (No Feedback-Less Lean POM). Follow framework imports, tags, and test.step Given/When/Then conventions.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

### Optional follow-ups (separate chats if you are testing skill trigger)

**`selectors`** — after you paste current locators or snippets:

```text
Review these Coffee Cart menu and header locators and replace brittle ones with the framework's semantic strategy (getByRole / getByLabel first). Keep scope to the product grid and call out nav collisions.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

**`test-standards`** — if the spec needs a conventions pass:

```text
Rewrite tests/coffee-cart/functional/menu.spec.ts to match our imports, single tag per test, and Given/When/Then test.step structure. Keep expect() out of page object classes.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

**`fixtures`** — only after POMs are complete:

```text
Add a fixture for the updated menu/header page objects and register them in the merged test options once the Lean POM surface is complete (including any feedback/summary controls the UI exposes).

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

---

## 3. Second pass with `pw-review`

Run a review pass (or invoke the **pw-review** skill) on:

- `pages/coffee-cart/menu.page.ts`, `pages/components/header.component.ts`
- `tests/coffee-cart/functional/menu.spec.ts`

Confirm fixture imports, tags (`@smoke` / `@sanity` / `@regression`), `test.step` Given/When/Then structure, and no `expect()` inside page object classes.

### Prompt to use (skill: `pw-review`)

```text
Review these changed Playwright files for framework compliance, Lean POM, selector quality, and regression risk: pages/coffee-cart/menu.page.ts, pages/components/header.component.ts, tests/coffee-cart/functional/menu.spec.ts. Flag findings first; do not rewrite unless a fix is clearly required.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

---

## See also

- [Pack 1 Lean POM checklist](./skills-checklist-pack-1-lean-pom.md)
- [Skills testing guide](./skills-testing.md)

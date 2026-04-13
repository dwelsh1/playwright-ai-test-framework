# Sauce Demo skill test walkthrough

Reproducible sequence for extending **Sauce Demo** coverage (login, inventory, product detail, cart badge) while staying aligned with **Lean POM** and framework rules.

Sauce Demo is a **public hosted** app — there is no local startup step. See [Sauce Demo App Guide](../usage/sauce-demo-app.md) for users, `sauceDemoConfig`, enums, and fixture names (`sdLoginPage`, `sdInventoryPage`, `sdProductDetailPage`).

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

1. Confirm the site is reachable (default `https://www.saucedemo.com`, or set `SAUCE_DEMO_URL` — see [README](../../README.md) — Application Under Test (Sauce Demo)).
2. Open the app: `npx playwright-cli open https://www.saucedemo.com` (or your `SAUCE_DEMO_URL` value).
3. Use `playwright-cli snapshot` on the **login** page (username/password placeholders, Login button, error region), then sign in with a standard user (for example `standard_user` / `secret_sauce` — see the app guide) and snapshot **inventory** (product list container, cart badge, add-to-cart controls, product title links) and, if needed, a **product detail** page after opening one item.
4. Remember Sauce Demo surfaces many controls via **`data-test`** attributes (the `sauce-demo` project uses the matching test id attribute — see `playwright.config.ts`); snapshots help map those ids to what you will expose in page objects.
5. Do **not** substitute IDE browser MCP or `codegen` for this exploration step (`CLAUDE.md` — No Substitute UI Exploration).

### Prompt to use (skill: `playwright-cli`)

Use a **fresh chat** when validating that this skill triggers on natural language.

```text
Use playwright-cli to explore Sauce Demo at https://www.saucedemo.com (or my SAUCE_DEMO_URL). Capture the login page (fields, Login button, error area), then sign in with standard_user / secret_sauce and capture the inventory page (product list, cart badge, add-to-cart buttons, links to product detail). Summarize what we should automate next. Do not substitute IDE browser tools or codegen for this exploration.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

Shorter variant:

```text
Use playwright-cli to explore Sauce Demo login and inventory, then summarize what to automate (do not substitute IDE browser tools for exploration).

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

---

## 2. Implementation prompts (what to ask for)

Target files (adjust paths if your tree differs):

- `pages/sauce-demo/login.page.ts`, `pages/sauce-demo/inventory.page.ts`, `pages/sauce-demo/product-detail.page.ts`
- `tests/sauce-demo/e2e/product-browse.spec.ts`, `tests/sauce-demo/e2e/cart-management.spec.ts`

Rules to keep in the prompt so the assistant stays on **Lean POM** and **Sauce Demo conventions**:

- Readonly constructor locators on `SdLoginPage` / `SdInventoryPage` / `SdProductDetailPage`; scope inventory locators to the real product list (for example the inventory container) so helpers do not match unrelated regions.
- Actions only in page objects; `expect()` only in specs.
- Use **`sauceDemoConfig`** and **`Routes` / `ProductNames` / enums** from `enums/sauce-demo/sauce-demo.ts` for URLs and repeated strings — no hardcoded full URLs.
- Use **`generateSauceDemoCredentials()`** (or the agreed factory pattern) for valid login data unless the scenario requires a locked or error user.
- Register nothing new in fixtures until the Lean POM surface is complete, including login **error** feedback and any inventory/cart UI you need to assert on (see **No Feedback-Less Lean POM** in `CLAUDE.md`). Existing Sauce Demo fixtures already use the **`sd`** prefix in `fixtures/pom/page-object-fixture.ts`.

### Primary prompt (skill: `page-objects` + related authoring)

```text
Extend Sauce Demo coverage using Lean POM. Update or add readonly constructor locators and action methods on SdLoginPage, SdInventoryPage, and/or SdProductDetailPage—keep inventory locators scoped to the product list area. Put assertions and expect() only in tests under tests/sauce-demo/e2e/. Use sauceDemoConfig, Routes, and ProductNames instead of hardcoded URLs. Use generateSauceDemoCredentials() for standard login unless the test needs a special user. Do not add new fixture registrations until page objects expose the real controls we need to assert (No Feedback-Less Lean POM). Follow framework imports, @e2e tagging, and test.step Given/When/Then conventions.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

### Optional follow-ups (separate chats if you are testing skill trigger)

**`selectors`** — after you paste current locators or snippets:

```text
Review these Sauce Demo page object locators and replace brittle ones with the framework's preferred strategy: semantic locators (getByRole / getByLabel / placeholders) first, and data-test ids where the app exposes them. Call out collisions between the menu, inventory list, and cart badge.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

**`test-standards`** — if the spec needs a conventions pass:

```text
Rewrite tests/sauce-demo/e2e/<spec-file>.spec.ts to match our imports, single @e2e tag per test, and Given/When/Then test.step structure. Keep expect() out of page object classes.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

**`fixtures`** — only after POMs are complete:

```text
Register the new or updated Sauce Demo page object on the merged test options (sd-prefixed fixture) once the Lean POM surface is complete, including any login error or cart feedback locators the tests need.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

**`data-strategy`** — if you are adding or changing credentials scenarios:

```text
Add or adjust Sauce Demo test data using the auth factory pattern in test-data/factories/sauce-demo/ and keep special users (locked_out_user, etc.) aligned with docs/usage/sauce-demo-app.md.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

---

## 3. Second pass with `pw-review`

Run a review pass (or invoke the **pw-review** skill) on whichever files you changed, for example:

- `pages/sauce-demo/login.page.ts`, `pages/sauce-demo/inventory.page.ts`, `pages/sauce-demo/product-detail.page.ts`
- `tests/sauce-demo/e2e/product-browse.spec.ts`, `tests/sauce-demo/e2e/cart-management.spec.ts`
- `fixtures/pom/page-object-fixture.ts` (if fixture registration changed)

Confirm merged fixture imports, **`@e2e`** tagging, `test.step` Given/When/Then structure, **no hardcoded base URLs** (use `sauceDemoConfig` + `Routes`), and no `expect()` inside page object classes.

### Prompt to use (skill: `pw-review`)

```text
Review these changed Playwright files for framework compliance, Lean POM, Sauce Demo conventions (sauceDemoConfig, enums, sd fixtures), selector quality, and regression risk: <list your paths>. Flag findings first; do not rewrite unless a fix is clearly required.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

Concrete example (edit the list if your diff is smaller):

```text
Review these changed Playwright files for framework compliance, Lean POM, Sauce Demo conventions, selector quality, and regression risk: pages/sauce-demo/login.page.ts, pages/sauce-demo/inventory.page.ts, pages/sauce-demo/product-detail.page.ts, tests/sauce-demo/e2e/product-browse.spec.ts, tests/sauce-demo/e2e/cart-management.spec.ts. Flag findings first; do not rewrite unless a fix is clearly required.

When you finish, paste into chat a markdown section titled exactly "## Skill test result" with bullet lines for Skill (skill id), Prompt used (verbatim user request for this turn), Expected behavior (what the relevant framework skill requires here), Actual behavior (concise summary of what you did in this reply), Verdict (Pass / Partial / Fail — self-assessed; use "Needs human" if you cannot judge), and Notes (gaps, risks, or what a human should verify).
```

---

## See also

- [Pack 1 Lean POM checklist](./skills-checklist-pack-1-lean-pom.md)
- [Skills testing guide](./skills-testing.md)
- [Sauce Demo App Guide](../usage/sauce-demo-app.md)

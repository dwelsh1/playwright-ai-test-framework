# Menu skill test walkthrough

Reproducible sequence for extending Coffee Cart menu coverage while staying aligned with **Lean POM** and framework rules.

## 1. Explore with `playwright-cli`

1. Start Coffee Cart locally (see [README](../../README.md) — Application Under Test).
2. Open the app and sign in: `npx playwright-cli open http://localhost:5273` (or your configured base URL).
3. Use `playwright-cli snapshot` after navigation to capture roles, lists, banner actions (cart, checkout summary, optional GitHub link), and card structure (headings, prices, ingredient regions vs image-only cards).
4. Do **not** substitute IDE browser MCP or `codegen` for this exploration step (`CLAUDE.md` — No Substitute UI Exploration).

## 2. Implementation prompt (what to ask for)

- New or updated locators on `MenuPage` / `HeaderComponent`: readonly constructor fields, scoped to the **product grid** (avoid matching nav-only lists).
- Actions only in page objects; assertions and `expect()` only in specs.
- Register nothing in fixtures until the Lean POM shape is complete, including feedback or summary controls the UI exposes (see **No Feedback-Less Lean POM** in `CLAUDE.md`).

## 3. Second pass with `pw-review`

Run a review pass (or invoke the **pw-review** skill) on:

- `pages/coffee-cart/menu.page.ts`, `pages/components/header.component.ts`
- `tests/coffee-cart/functional/menu.spec.ts`

Confirm fixture imports, tags (`@smoke` / `@sanity` / `@regression`), `test.step` Given/When/Then structure, and no `expect()` inside page object classes.

## See also

- [Pack 1 Lean POM checklist](./skills-checklist-pack-1-lean-pom.md)
- [Skills testing guide](./skills-testing.md)

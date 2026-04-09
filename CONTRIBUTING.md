# Contributing

Thanks for contributing to `playwright-ai-test-framework`.

This repository is a Playwright + TypeScript test automation framework with strong conventions around fixtures, page objects, Zod schemas, test data, and AI-assisted workflows. The fastest way to contribute successfully is to follow the existing patterns rather than inventing new ones.

## Before You Start

- Read `README.md` for setup and common commands
- Read `docs/developer.md` for framework architecture and conventions
- Use `docs/usage/skills-guide.md` if you are working with Claude, Cursor, or GitHub Copilot agents
- Prefer updating existing patterns over introducing parallel ones

## Local Setup

```bash
npm install
npx playwright install
npm run build:smart-reporter
```

If you use the Coffee Cart app locally, start it from the separate `coffee-cart/` repo before running UI tests.

## Core Expectations

- Import `test` and `expect` from `fixtures/pom/test-options.ts`
- Use fixture injection instead of manually instantiating page objects in tests
- Prefer semantic locators: `getByRole()` first
- Use Faker factories for happy-path data and static JSON for invalid or boundary data
- Use `z.strictObject()` for API schemas
- Do not use `any`
- Do not use `page.waitForTimeout()`
- Keep docs, skills, and generated GitHub agents in sync when you change them

## Validation Before Opening A PR

Run the relevant checks for your change. For a normal framework change, this is the baseline:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run sync:github-agents
```

If you only changed a smaller area, run the focused tests that exercise that area as well.

## Documentation And Skills

If you update framework behavior, also update the active docs that describe it:

- `README.md`
- `docs/developer.md`
- relevant files in `docs/usage/`

If you update any skill:

1. Keep `.cursor/skills/` and `.claude/skills/` aligned
2. Regenerate GitHub mirrors:

```bash
npm run sync:github-agents
```

## Pull Requests

When opening a PR, include:

- a short summary of what changed
- why the change was needed
- how you validated it
- screenshots or verification notes if the change affected user-visible behavior

For user-visible UI work, consider using the `trust-but-verify` workflow and storing the results in `docs/verification/` when that evidence is worth keeping.

## Release Notes

If the change affects framework capabilities, scripts, docs, or developer workflows, update `CHANGELOG.md` as part of the same PR.

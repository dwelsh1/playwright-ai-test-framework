# Verification Reports

This folder stores manual verification reports produced by workflows such as `trust-but-verify`.

Use it for browser-based checks that compare:

- the expected behavior described in a PR, issue, requirements note, or user request
- the implemented branch or diff
- the behavior of the live app

---

## Naming Convention

Verification reports should use this filename pattern:

```text
YYYY-MM-DD-<branch-slug>.md
```

Examples:

- `2026-03-26-feature-admin-dashboard.md`
- `2026-03-26-bugfix-checkout-validation.md`

Branch slugs should replace `/` with `-`.

---

## Screenshot Convention

Store screenshots under:

```text
docs/verification/screenshots/<branch-slug>/
```

Suggested filename pattern:

```text
<page-or-flow>-<state>-<viewport>.png
```

Examples:

- `admin-dashboard-loaded-desktop.png`
- `checkout-error-mobile.png`
- `orders-empty-state-tablet.png`

---

## What A Good Report Includes

Each report should capture:

- the requirements source
- the branch name
- the app URL used for verification
- summary counts for PASS, CONCERN, FAIL, and OUT-OF-SCOPE
- the pages or flows that were checked
- the exact mismatches found, if any
- screenshot paths when evidence was captured

The bundled template for the `trust-but-verify` skill lives at:

- `.cursor/skills/trust-but-verify/report-template.md`
- `.claude/skills/trust-but-verify/report-template.md`

---

## Commit Guidance

Treat these reports as review artifacts, not mandatory source files.

- Commit them when they document a meaningful branch verification, demo-readiness pass, or signoff trail you want to keep in the repo
- Skip committing them when they are temporary working notes for a one-off local check

If screenshots are committed, keep only the ones that materially support findings.

---

## Related Docs

- `docs/usage/skills-guide.md`
- `docs/usage/skill-prompt-examples.md`
- `docs/developer.md`

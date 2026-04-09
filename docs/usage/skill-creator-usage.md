# Skill Creator — Usage Guide

This guide walks through how to use the `skill-creator` skill to build, test, and improve AI skills in this framework. It assumes you know how to open a terminal and run Claude Code, but not much more than that.

---

## What Is a Skill?

A **skill** is a markdown file (called `SKILL.md`) that tells the AI exactly how to do a specific task — like reviewing an API test, writing a page object, or running a debugging workflow. When you describe a task to Claude and it matches a skill's description, Claude automatically reads that skill and follows its instructions.

Skills live in two places (kept in sync):

- `.claude/skills/{skill-name}/SKILL.md` — used by Claude Code
- `.cursor/skills/{skill-name}/SKILL.md` — used by Cursor

---

## When Should You Use the Skill Creator?

Use this skill when you want to:

- **Create a brand-new skill** from scratch (e.g., "a skill for reviewing database migrations")
- **Improve an existing skill** that isn't giving good results
- **Test whether a skill actually works** by running it against real prompts
- **Optimize a skill's description** so Claude triggers it at the right times

---

## Overview of the Process

```
1. Describe what you want the skill to do
2. Claude drafts the SKILL.md
3. Run 2–3 test prompts — once with the skill, once without
4. Review the outputs side by side
5. Give feedback, Claude improves the skill
6. Repeat until you're happy
7. (Optional) Optimize the skill description for better triggering
```

---

## Repo-Specific Quick Start

In this framework, a finished skill is not done until all three mirrors are aligned:

- `.cursor/skills/{skill-name}/SKILL.md`
- `.claude/skills/{skill-name}/SKILL.md`
- `.github/agents/{skill-name}.md` via `npm run sync:github-agents`

That means the practical end-to-end workflow is:

1. Draft or improve the skill
2. Test it with realistic eval prompts
3. Iterate until the results are good
4. Mirror the final skill in `.cursor/` and `.claude/`
5. Update the skill indexes in `CLAUDE.md` and `.cursor/rules/rules.mdc`
6. Run `npm run sync:github-agents`
7. Optionally update `docs/usage/skills-guide.md` and `docs/testing/skills-testing.md` if the new skill should be discoverable and testable by other contributors

If you want the shorter manual QA view for trigger testing, use `docs/testing/skills-testing.md`.

---

## Step-by-Step Walkthrough

### Step 1 — Tell Claude What You Want

Start a new Claude Code session and describe the skill you want to create. You can be casual about it. Examples:

```
"I want to make a skill for reviewing database migrations."

"Can you turn this workflow we just did into a skill?"

"I want a skill that helps write Zod schemas from API responses."
```

Claude will ask you a few questions to understand:

1. What should the skill enable Claude to do?
2. When should it trigger? (what kinds of user messages should activate it)
3. What should the output look like?
4. Do you want test cases to verify it works?

> **Tip:** The more specific you are, the better the first draft will be. "Review Playwright page objects for missing feedback locators" is better than "review page objects."

---

### Step 2 — Review the Draft SKILL.md

Claude will write a draft `SKILL.md` and show it to you. Read through it and check:

- Does it describe the task correctly?
- Does the description (the part at the top under `description:`) sound like something you'd actually type?
- Are the instructions clear and specific enough?

You don't need to get it perfect now — the whole point of the next steps is to test and improve it.

---

### Step 3 — Agree on Test Cases

Claude will propose 2–3 test prompts — realistic examples of what a user might type to trigger this skill.

**Example test prompts for a "review page objects" skill:**

```
"Can you review my login page object?"
"Check this page object for any issues."
"I just wrote a new POM for checkout, what do you think?"
```

Review these and tell Claude if they look right, or if you want to add/change any. These become your benchmark — you'll use them to compare before/after versions of the skill.

---

### Step 4 — Claude Runs the Tests

Claude will run each test prompt **twice in parallel**:

- **With the skill** — Claude reads the skill and follows its instructions
- **Without the skill** (baseline) — Claude answers with no special guidance

This comparison lets you see exactly what difference the skill makes.

> **Note:** Claude does this automatically. You don't need to do anything — just wait.

---

### Step 5 — Review the Results

Claude will open a **review viewer** in your browser (or show results inline if no browser is available). For each test case you'll see:

- The prompt that was used
- The output **with** the skill
- The output **without** the skill (baseline)
- A feedback box for your comments

Go through each test case and write your thoughts in the feedback boxes. Examples of useful feedback:

- "The skill output caught the missing error message locator — great."
- "It didn't mention the three-section pattern at all."
- "Too verbose, the baseline was actually clearer."

When you're done, click **"Submit All Reviews"**.

> **Tip:** Empty feedback = you thought it was fine. Only write something if you want a change.

---

### Step 6 — Claude Improves the Skill

Based on your feedback, Claude will update the `SKILL.md` and re-run the tests. You'll see a new iteration of results alongside the previous one so you can compare.

This loop repeats until you're satisfied:

```
Review → Feedback → Improve → Re-run → Review again
```

Typical signs you're done:

- All your feedback boxes are empty (everything looked good)
- The "with skill" output is clearly better than the baseline
- You're not seeing meaningful improvements anymore

---

### Step 7 — (Optional) Optimize the Skill Description

The `description:` field in the SKILL.md frontmatter is what Claude reads to decide whether to use the skill. If the skill is working well but not triggering when it should (or triggering when it shouldn't), run the description optimizer.

Tell Claude: _"Let's optimize the skill description."_

Claude will:

1. Generate 20 test queries — half that should trigger the skill, half that shouldn't
2. Show them to you in a browser for review (you can edit/add/remove)
3. Run an automated optimization loop that tests different versions of the description
4. Show you the best-performing description and update the skill

> **You don't need to do anything technical here.** Claude handles all of it — just review the queries it proposes and give a thumbs-up or make edits.

---

### Step 8 — Sync To Both Skill Locations

When the skill is finalized, make sure it's copied to both skill directories:

```bash
cp .claude/skills/{skill-name}/SKILL.md .cursor/skills/{skill-name}/SKILL.md
```

Then add it to the skills index in both `CLAUDE.md` and `.cursor/rules/rules.mdc`:

```markdown
| `skill-name` | When to read it | What it covers |
```

> **Note:** Claude should do this for you automatically, but it's worth double-checking.

### Step 9 — Regenerate GitHub Agents

After the `.cursor` and `.claude` copies are final, regenerate the GitHub mirror:

```bash
npm run sync:github-agents
```

Then verify that:

- `.github/agents/{skill-name}.md` exists
- the frontmatter points back to the canonical `.cursor` skill
- the generated description still reads well for GitHub Copilot

### Step 10 — Update Discovery Docs If Needed

If the skill is net-new or materially changed, update the docs that help people discover and test it:

- `docs/usage/skills-guide.md`
- `docs/testing/skills-testing.md`

Do this when the new skill should become part of the repo's supported, documented workflow rather than a private experiment.

---

## File Structure of a Skill

```
.claude/skills/
└── my-skill/
    ├── SKILL.md              ← The main skill file (required)
    ├── evals/
    │   └── evals.json        ← Test cases (created during eval process)
    ├── my-skill-workspace/   ← Test run results (created automatically)
    │   ├── iteration-1/
    │   │   ├── eval-0/
    │   │   │   ├── with_skill/outputs/
    │   │   │   └── without_skill/outputs/
    │   │   └── benchmark.json
    │   └── iteration-2/
    ├── scripts/              ← Optional helper scripts
    ├── references/           ← Optional reference docs loaded on demand
    └── assets/               ← Optional templates and files
```

You only need to worry about `SKILL.md` and `evals/evals.json`. The rest is created automatically.

---

## Anatomy of a SKILL.md

```markdown
---
name: my-skill
description: What the skill does and WHEN to use it. This is what Claude reads
  to decide whether to activate the skill. Be specific and mention
  the kinds of user phrases that should trigger it.
---

# Skill Title

Brief explanation of what this skill does.

## Section 1 — Core Instructions

What Claude should do first.

## Section 2 — Detailed Steps

Step-by-step instructions.

## Examples

Input: "some user prompt"
Output: "the expected response format"
```

**Key rules for writing SKILL.md:**

- Keep it under 500 lines if possible
- Put large reference material in a separate `references/` file and link to it
- The `description:` field is the most important part for triggering — be specific
- Use plain, imperative language ("Do X", "Check Y", "Return Z")

---

## Example: Creating a Simple Skill

Here's a real example of what the conversation might look like.

**You:** "I want a skill that reminds Claude to always check for missing `await` keywords when reviewing test files."

**Claude:** "Got it. A few questions:

1. Should this trigger on any code review, or only Playwright tests?
2. Should it suggest fixes, or just flag the issues?
3. Do you want a specific output format (e.g., numbered list of issues)?"

**You:** "Only Playwright tests. Flag and suggest fixes. Numbered list is fine."

**Claude:** _writes SKILL.md draft_

**You:** "Looks good. What test cases are you thinking?"

**Claude:** "Here are 3:

1. 'Can you review this test file for issues?'
2. 'Check my login spec for any problems.'
3. 'Review tests/checkout.spec.ts'"

**You:** "Add one more: 'Look at this test and tell me if anything is wrong.'"

**Claude:** _runs 4 test cases in parallel with and without skill_

**You:** _(reviews results in browser, leaves feedback on 2 cases)_

**Claude:** _improves skill, re-runs, presents iteration 2_

**You:** _(all feedback boxes empty)_

**Claude:** "Everything looks good. Want me to optimize the description too?"

---

## Troubleshooting

| Problem                                | What to do                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Skill doesn't trigger when it should   | Run the description optimizer (Step 7)                                                |
| Skill triggers too often               | Make the description more specific                                                    |
| Test results look the same as baseline | The skill instructions aren't specific enough — add more detail                       |
| Browser viewer doesn't open            | Ask Claude to show results inline instead                                             |
| You're not sure what feedback to give  | Focus on: did it catch the right things? did it miss anything? was it too long/short? |

---

## Quick Reference — Useful Phrases

When talking to Claude during skill creation:

| What you want                | What to say                                          |
| ---------------------------- | ---------------------------------------------------- |
| Start fresh                  | "I want to create a skill for [X]"                   |
| Work on existing skill       | "Let's improve the [skill-name] skill"               |
| Skip straight to testing     | "The draft looks good, let's run the tests"          |
| Skip the eval browser        | "Show me the results inline"                         |
| Skip optimization            | "No need to optimize the description, let's ship it" |
| Turn a workflow into a skill | "Turn what we just did into a skill"                 |

---

## See Also

- [skill-creator SKILL.md](.../../.claude/skills/skill-creator/SKILL.md) — The full skill with all technical details
- [CLAUDE.md](../../CLAUDE.md) — Framework rules and skills index

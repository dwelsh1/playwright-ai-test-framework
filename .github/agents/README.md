# GitHub Copilot custom agents

These Markdown files are **[GitHub Copilot custom agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)** for this repository. Each file mirrors one **Agent Skill** from `.cursor/skills/<name>/SKILL.md` (same content as `.claude/skills/`).

## Regenerate

After editing any `SKILL.md`, refresh agents from the repo root:

```bash
npm run sync:github-agents
```

Source script: `scripts/sync-github-agents.cjs`. These files are generated mirrors of the repo's canonical skill set.

## Note

Copilot uses a different frontmatter schema than [agentskills.io](https://agentskills.io/specification); do not edit `.github/agents/*.md` by hand unless you are fixing a one-off — prefer changing `.cursor/skills` and re-running the sync command.

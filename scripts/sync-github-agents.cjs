#!/usr/bin/env node
// Generate GitHub Copilot custom agents from .cursor/skills (each folder's SKILL.md).
// Writes .github/agents/{folder-name}.md as GitHub Copilot mirrors of the canonical .cursor skills.
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const COPILOT_BODY_CHAR_LIMIT = 30_000;
const repoRoot = path.join(__dirname, '..');
const skillsDir = path.join(repoRoot, '.cursor', 'skills');
const outDir = path.join(repoRoot, '.github', 'agents');

function stringifyMetadata(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    out[String(k)] =
      v === null || v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

function parseSkillFile(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) {
    throw new Error('Invalid SKILL.md: expected YAML frontmatter between --- delimiters');
  }
  const data = YAML.parse(m[1]);
  const body = m[2];
  return { data, body };
}

function buildCopilotDoc(skillId, data, body) {
  const description = (data.description || '').trim();
  if (!description) {
    throw new Error(`Missing description in frontmatter for skill "${skillId}"`);
  }

  const meta = {
    framework_skill_id: skillId,
    source_path: `.cursor/skills/${skillId}/SKILL.md`,
    ...stringifyMetadata(data.metadata),
  };
  if (data.license != null && data.license !== '') meta.license = String(data.license);
  if (data.compatibility != null && data.compatibility !== '')
    meta.compatibility = String(data.compatibility);
  if (data['allowed-tools'] != null && data['allowed-tools'] !== '')
    meta.allowed_tools_agent_skills = String(data['allowed-tools']);

  const extendedDescription = `${description} Framework skill ID: ${skillId}. Canonical source: .cursor/skills/${skillId}/SKILL.md. Regenerate this agent: npm run sync:github-agents`;

  const copilotFm = {
    name: data.name || skillId,
    description: extendedDescription,
    metadata: meta,
  };

  const banner = `> **GitHub Copilot custom agent** — Synced from Agent Skills at \`.cursor/skills/${skillId}/SKILL.md\`. Regenerate: \`npm run sync:github-agents\`.\n\n`;

  let outBody = body.trimStart();
  const maxBody = COPILOT_BODY_CHAR_LIMIT - banner.length;
  if (outBody.length > maxBody) {
    const cut = Math.max(0, maxBody - 400);
    outBody =
      outBody.slice(0, cut) +
      '\n\n---\n\n' +
      `_(Truncated to stay within Copilot\'s ${COPILOT_BODY_CHAR_LIMIT.toLocaleString()} character body limit; see full skill in \`.cursor/skills/${skillId}/SKILL.md\`.)_\n`;
  }

  const yamlFm = YAML.stringify(copilotFm, { lineWidth: 0 }).trimEnd();
  return `---\n${yamlFm}\n---\n\n${banner}${outBody}`;
}

function main() {
  if (!fs.existsSync(skillsDir)) {
    console.error('Missing skills directory:', skillsDir);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const dirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let count = 0;
  for (const skillId of dirs) {
    const skillPath = path.join(skillsDir, skillId, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    const content = fs.readFileSync(skillPath, 'utf8');
    const { data, body } = parseSkillFile(content);

    if (data.name && data.name !== skillId) {
      console.warn(
        `Warning: folder "${skillId}" vs frontmatter name "${data.name}" — output file uses folder id.`,
      );
    }

    const doc = buildCopilotDoc(skillId, data, body);
    fs.writeFileSync(path.join(outDir, `${skillId}.md`), doc, 'utf8');
    count++;
  }

  console.log(`sync-github-agents: wrote ${count} file(s) to ${path.relative(repoRoot, outDir)}`);
}

main();

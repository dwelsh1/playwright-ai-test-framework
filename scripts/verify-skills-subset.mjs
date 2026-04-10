#!/usr/bin/env node
/**
 * Validates a fixed subset of .cursor/skills for docs/testing/skills-checklist-pack-1-lean-pom.md
 * — YAML frontmatter, description, minimum body size, and "Lean POM" in body where standardized.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const skillsDir = path.join(repoRoot, '.cursor', 'skills');

const skills = [
  'page-objects',
  'selectors',
  'fixtures',
  'test-standards',
  'pw-review',
  'playwright-cli',
];
const needLeanPomInBody = new Set([
  'page-objects',
  'selectors',
  'fixtures',
  'test-standards',
  'pw-review',
]);

function parseSkill(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('expected YAML frontmatter between --- delimiters');
  return { data: YAML.parse(m[1]), body: m[2] };
}

let allOk = true;
for (const id of skills) {
  let skillOk = true;
  const p = path.join(skillsDir, id, 'SKILL.md');
  if (!fs.existsSync(p)) {
    console.error(`FAIL missing: ${id}`);
    allOk = false;
    continue;
  }
  let data;
  let body;
  try {
    ({ data, body } = parseSkill(fs.readFileSync(p, 'utf8')));
  } catch (e) {
    console.error(`FAIL parse ${id}:`, e.message);
    allOk = false;
    continue;
  }
  const desc = (data.description ?? '').trim();
  if (desc.length < 10) {
    console.error(`FAIL empty/short description: ${id}`);
    skillOk = false;
  }
  if (body.length < 100) {
    console.error(`FAIL short body: ${id}`);
    skillOk = false;
  }
  if (needLeanPomInBody.has(id) && !body.includes('Lean POM')) {
    console.error(`FAIL body missing "Lean POM": ${id}`);
    skillOk = false;
  }
  if (!skillOk) {
    allOk = false;
  } else {
    console.log(`OK ${id}`);
  }
}

process.exit(allOk ? 0 : 1);

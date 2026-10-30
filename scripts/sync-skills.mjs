import fs from 'node:fs';
const body = name => fs.readFileSync(`.agents/skills/${name}/SKILL.md`, 'utf8').replace(/^---[\s\S]*?---\s*/, '');
fs.writeFileSync('server/skill-prompts.mjs', 'export const skills = '+JSON.stringify({generate:body('tuomaoba-create'),breakdown:body('tuomaoba-breakdown')},null,2)+';\n');

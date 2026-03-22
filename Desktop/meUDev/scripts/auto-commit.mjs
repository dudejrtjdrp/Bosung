#!/usr/bin/env node
import { execSync } from 'node:child_process';

const ALLOWED_TYPES = [
  'feat',
  'fix',
  'chore',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'revert',
];

const [type, scope, ...descriptionParts] = process.argv.slice(2);
const description = descriptionParts.join(' ').trim();

if (!type || !description) {
  console.error(
    'Usage: npm run commit:auto -- <type> <scope> <description>\n' +
      'Example: npm run commit:auto -- feat react-native add memory trigger modal',
  );
  process.exit(1);
}

if (!ALLOWED_TYPES.includes(type)) {
  console.error(`Invalid type: ${type}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
  process.exit(1);
}

const safeScope = (scope ?? '').replace(/[^a-zA-Z0-9-]/g, '');
const scopePart = safeScope ? `(${safeScope})` : '';
const message = `${type}${scopePart}: ${description}`;

const run = (command) => execSync(command, { stdio: 'inherit' });

try {
  run('git add .');

  try {
    run(`git diff --cached --quiet`);
    console.log('No staged changes detected. Skipping commit.');
    process.exit(0);
  } catch {
    // Changes exist in index.
  }

  run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  console.log(`Committed with message: ${message}`);
} catch {
  process.exit(1);
}

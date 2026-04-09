const { spawnSync } = require('child_process');

const envName = process.argv[2];
const playwrightArgs = process.argv.slice(3);

if (!envName) {
  console.error('Usage: node scripts/run-playwright-env.cjs <env-name> [playwright args...]');
  process.exit(1);
}

const result = spawnSync('npx', ['playwright', 'test', ...playwrightArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TEST_ENV: envName,
  },
  shell: true,
});

process.exit(result.status ?? 0);

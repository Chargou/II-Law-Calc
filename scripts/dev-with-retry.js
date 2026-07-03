import { spawnSync } from 'child_process';

function run(args) {
  return spawnSync('npx', args, { stdio: 'inherit', shell: true });
}

let retried = false;
while (true) {
  const result = run(['vite']);
  if (result.status === 0) break;
  if (retried) {
    process.exit(result.status);
  }
  console.log('\nvite failed — running postinstall and retrying once...\n');
  const bindResult = run(['node', 'scripts/install-bindings.js']);
  if (bindResult.status !== 0) {
    console.error('install-bindings also failed — try running `npm install` manually');
    process.exit(bindResult.status);
  }
  retried = true;
}

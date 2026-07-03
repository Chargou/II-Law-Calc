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
  run(['node', 'scripts/install-bindings.js']);
  retried = true;
}

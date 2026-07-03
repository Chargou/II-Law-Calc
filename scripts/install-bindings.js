import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function getInstalledVersion(pkg) {
  const p = resolve(root, 'node_modules', pkg, 'package.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8')).version;
}

const platform = process.platform; // 'win32' or 'linux'
const BINDINGS = platform === 'win32'
  ? [
      { pkg: '@rolldown/binding-win32-x64-msvc', host: 'rolldown', file: 'rolldown-binding.win32-x64-msvc.node' },
      { pkg: 'lightningcss-win32-x64-msvc', host: 'lightningcss', file: 'lightningcss.win32-x64-msvc.node' },
    ]
  : [
      { pkg: '@rolldown/binding-linux-x64-gnu', host: 'rolldown', file: 'rolldown-binding.linux-x64-gnu.node' },
      { pkg: 'lightningcss-linux-x64-gnu', host: 'lightningcss', file: 'lightningcss.linux-x64-gnu.node' },
    ];

let installed = 0;

for (const { pkg, host, file } of BINDINGS) {
  const pkgDir = resolve(root, 'node_modules', pkg);
  const binaryFile = resolve(pkgDir, file);

  if (existsSync(binaryFile)) {
    installed++;
    continue;
  }

  const version = getInstalledVersion(host);
  if (!version) continue;

  // npm may have removed the package entirely (wrong platform for optionalDeps).
  // Install it explicitly; --force bypasses cache so we get a fresh copy.
  try {
    execSync(`npm install --force --ignore-scripts --no-save --no-package-lock ${pkg}@${version}`, {
      stdio: 'pipe',
      cwd: root,
    });
    installed++;
  } catch (e) {
    // platform mismatch or network — silently ignore
  }
}

// Exit with non-zero if we couldn't get the binding needed for this platform
if (installed === 0) {
  console.error(`install-bindings: no ${platform} binding could be installed`);
  process.exit(1);
}

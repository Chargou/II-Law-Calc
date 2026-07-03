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

const BINDINGS = [
  { pkg: '@rolldown/binding-win32-x64-msvc', host: 'rolldown', file: 'rolldown-binding.win32-x64-msvc.node' },
  { pkg: '@rolldown/binding-linux-x64-gnu', host: 'rolldown', file: 'rolldown-binding.linux-x64-gnu.node' },
  { pkg: 'lightningcss-win32-x64-msvc', host: 'lightningcss', file: 'lightningcss.win32-x64-msvc.node' },
  { pkg: 'lightningcss-linux-x64-gnu', host: 'lightningcss', file: 'lightningcss.linux-x64-gnu.node' },
];

for (const { pkg, host, file } of BINDINGS) {
  const pkgDir = resolve(root, 'node_modules', pkg);
  const binaryFile = resolve(pkgDir, file);

  // Check actual binary exists, not just the package directory
  if (existsSync(binaryFile)) continue;

  const version = getInstalledVersion(host);
  if (!version) continue;

  // If directory exists but binary is missing (npm cleaned it), skip cache by force
  try {
    execSync(`npm install --force --ignore-scripts --no-save --no-package-lock ${pkg}@${version}`, {
      stdio: 'pipe',
      cwd: root,
    });
  } catch (e) {
    // platform mismatch or network issue — ignore
  }
}

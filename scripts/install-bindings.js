import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function getInstalledVersion(pkgName) {
  const p = resolve(root, 'node_modules', pkgName, 'package.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8')).version;
}

const BINDINGS = [
  ['@rolldown/binding-win32-x64-msvc', 'rolldown'],
  ['@rolldown/binding-linux-x64-gnu', 'rolldown'],
  ['lightningcss-win32-x64-msvc', 'lightningcss'],
  ['lightningcss-linux-x64-gnu', 'lightningcss'],
];

for (const [pkg, host] of BINDINGS) {
  const p = resolve(root, 'node_modules', pkg);
  if (existsSync(p)) continue;

  const version = getInstalledVersion(host);
  if (!version) continue;

  try {
    execSync(`npm install --force --ignore-scripts --no-save --no-package-lock ${pkg}@${version}`, {
      stdio: 'pipe',
      cwd: root,
    });
  } catch (e) {
    // silently ignore — platform mismatch or network issue
  }
}

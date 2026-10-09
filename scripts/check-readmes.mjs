import {readFile, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = ['README.md', 'README.en.md', 'README.ja.md', 'README.ko.md', 'README.de.md'];
const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).intentkitVersion;
let checked = 0;
for (const name of names) {
  const text = await readFile(path.join(root, name), 'utf8');
  if (!text.includes(version)) throw new Error(`${name}: missing current version ${version}`);
  for (const other of names) {
    if (!text.includes(`(${other})`)) throw new Error(`${name}: missing language link ${other}`);
  }
  const targets = [
    ...Array.from(text.matchAll(/\]\(([^)\s]+)\)/g), match => match[1]),
    ...Array.from(text.matchAll(/(?:src|href)="([^"]+)"/g), match => match[1]),
  ];
  for (const target of targets) {
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const resolved = path.resolve(root, decodeURIComponent(target.split('#')[0]));
    if (!resolved.startsWith(root + path.sep)) throw new Error(`${name}: path outside repository: ${target}`);
    await access(resolved).catch(() => {throw new Error(`${name}: missing linked file ${target}`);});
    checked++;
  }
}
console.log(`README check: ${names.length} languages, ${checked} local links/assets, version ${version}.`);

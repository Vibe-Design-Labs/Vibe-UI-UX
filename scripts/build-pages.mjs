import './build.mjs';
import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'dist/pages');
await mkdir(target, {recursive: true});
await cp(path.join(root, 'dist/client'), target, {recursive: true});
await writeFile(path.join(target, 'transport.js'), "export const transportMode = 'direct';\n");
await writeFile(path.join(target, '.nojekyll'), '');
const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://tokendance.space; object-src 'none'; base-uri 'self'; form-action 'self'";
for (const name of ['index.html', 'studio.html', 'docs.html']) {
  const file = path.join(target, name);
  const html = await readFile(file, 'utf8');
  await writeFile(file, html.replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="' + policy + '">'));
}
console.log('GitHub Pages ready: dist/pages/; portable relative URLs, browser-direct BYOK, no server secrets.');

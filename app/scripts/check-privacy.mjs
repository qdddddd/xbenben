import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('..');
const forbidden = p => /(^|\/)analytics7-model\.xml$|^PROMPT\.md$|^uploads\/|^app\/(evidence|tests\/private)\/|^app\/playwright\.private\.config\.js$/.test(p);
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const history = execFileSync('git', ['rev-list', '--objects', '--all'], { cwd: root, encoding: 'utf8' }).split('\n').map(line => line.slice(41));
if ([...tracked, ...history].some(forbidden)) throw new Error('A private path is present in Git. Do not publish.');
const files = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(directory, e.name)) : [path.join(directory, e.name)]);
const built = files('dist');
if (built.some(p => /analytics7-model|PROMPT|uploads|evidence|tests/.test(p))) throw new Error('A private path is present in the site.');
const privateFile = path.join(root, 'analytics7-model.xml');
if (fs.existsSync(privateFile)) {
  const source = fs.readFileSync(privateFile, 'utf8');
  const markers = [...source.matchAll(/<cash\b[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
  for (const name of [...tracked.map(p => path.join(root, p)), ...built]) {
    const content = fs.readFileSync(name, 'utf8');
    if (markers.some(marker => content.includes(marker))) throw new Error('Private session identifiers are present in a publishable file.');
  }
}
const sample = fs.readFileSync('dist/sample-analytics7.xml', 'utf8');
if (!sample.includes('Entirely fictional demo data')) throw new Error('The published sample is not the synthetic fixture.');
console.log('Privacy check passed: private paths absent from Git history and site; only synthetic sample data ships.');

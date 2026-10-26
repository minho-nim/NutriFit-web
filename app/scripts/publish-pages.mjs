import {copyFile, mkdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(appDir, '..');
const distDir = path.join(appDir, 'dist');

await rm(path.join(repoDir, 'assets'), {recursive: true, force: true});
await mkdir(path.join(repoDir, 'assets'), {recursive: true});
await copyFile(path.join(distDir, 'index.html'), path.join(repoDir, 'index.html'));
await copyFile(path.join(distDir, 'index.html'), path.join(repoDir, '404.html'));
await import('node:fs/promises').then(({cp}) => cp(path.join(distDir, 'assets'), path.join(repoDir, 'assets'), {recursive: true}));
console.log('GitHub Pages files updated in repository root. Commit and push these changes to publish.');

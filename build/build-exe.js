'use strict';

// Builds a standalone executable of demo-server using Node's Single
// Executable Application (SEA) support. Produces dist/demo-server(.exe).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const isWin = process.platform === 'win32';
const exeName = isWin ? 'demo-server.exe' : 'demo-server';
const exePath = path.join(dist, exeName);
const bundlePath = path.join(dist, 'bundle.js');
const blobPath = path.join(dist, 'sea-prep.blob');
const seaConfigPath = path.join(__dirname, 'sea-config.json');

fs.mkdirSync(dist, { recursive: true });

console.log('[build] bundling server.js with esbuild...');
execFileSync(
  process.platform === 'win32'
    ? path.join(root, 'node_modules', '.bin', 'esbuild.cmd')
    : path.join(root, 'node_modules', '.bin', 'esbuild'),
  [
    path.join(root, 'server.js'),
    '--bundle',
    '--platform=node',
    '--target=node20',
    '--outfile=' + bundlePath,
  ],
  { stdio: 'inherit', shell: isWin }
);

console.log('[build] generating SEA blob...');
execFileSync(process.execPath, ['--experimental-sea-config', seaConfigPath], {
  cwd: root,
  stdio: 'inherit',
});

console.log('[build] copying node binary...');
fs.copyFileSync(process.execPath, exePath);
if (!isWin) fs.chmodSync(exePath, 0o755);

console.log('[build] injecting blob with postject...');
const postjectArgs = [
  path.join(root, 'node_modules', 'postject', 'dist', 'cli.js'),
  exePath,
  'NODE_SEA_BLOB',
  blobPath,
  '--sentinel-fuse',
  'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
];
if (process.platform === 'darwin') {
  postjectArgs.push('--macho-segment-name', 'NODE_SEA');
}
execFileSync(process.execPath, postjectArgs, { stdio: 'inherit' });

// Ship the default config next to the executable so it's easy to edit.
fs.copyFileSync(path.join(root, 'config.json'), path.join(dist, 'config.json'));

console.log(`[build] done -> ${exePath}`);

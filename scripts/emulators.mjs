#!/usr/bin/env node
/** Local-only Firebase development and rule testing; never contacts a production project. */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] || 'start';
const project = 'demo-design-gym';
const command = mode === 'test' ? 'emulators:exec' : 'emulators:start';
const validModes = new Set(['start', 'test', 'test-running']);
if (!validModes.has(mode)) {
  console.error('Usage: node scripts/emulators.mjs [start|test|test-running]');
  process.exit(1);
}

function supportedNode(version) {
  const [major, minor] = version.split('.').map(Number);
  return major > 24 || (major === 24 && minor >= 12);
}

// Firebase's current rules testing library requires Node 24.12+. Keep other app scripts independent.
if (!supportedNode(process.versions.node)) {
  const versionRoots = [
    process.env.FNM_DIR && join(process.env.FNM_DIR, 'node-versions'),
    join(homedir(), '.local/share/fnm/node-versions'),
    join(homedir(), 'Library/Application Support/fnm/node-versions'),
    join(homedir(), '.nvm/versions/node'),
  ].filter(Boolean);
  const candidates = versionRoots.flatMap(directory => existsSync(directory)
    ? readdirSync(directory).flatMap(version => [join(directory, version, 'installation/bin/node'), join(directory, version, 'bin/node')])
    : []);
  const runtime = candidates.filter(existsSync).find(binary => {
    const version = spawnSync(binary, ['--version'], { encoding: 'utf8' });
    return version.status === 0 && supportedNode(version.stdout.trim().replace(/^v/, ''));
  });
  if (!runtime) {
    console.error('Firebase tests require Node 24.12 or newer. Install a supported runtime (for example: fnm install 24), then retry.');
    process.exit(1);
  }
  const child = spawn(runtime, [fileURLToPath(import.meta.url), mode], { cwd: root, stdio: 'inherit', env: process.env });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('exit', code => process.exit(code ?? 1));
  child.on('error', error => { console.error(error.message); process.exit(1); });
} else {
  await run();
}

async function run() {
  const cli = join(root, 'node_modules/firebase-tools/lib/bin/firebase.js');
  if (!existsSync(cli)) {
    console.error('Firebase tooling is not installed. Run npm install first.');
    process.exit(1);
  }
  const cache = join(homedir(), 'Library/Caches/design-gym-tools');
  const cacheMarker = join(cache, 'java-home.txt');
  const javaCandidates = [
    process.env.JAVA_HOME,
    existsSync(cacheMarker) ? readFileSync(cacheMarker, 'utf8').trim() : undefined,
    '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
    '/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home',
  ].filter(Boolean);
  const javaHome = javaCandidates.find(candidate => existsSync(join(candidate, 'bin/java')));
  const javaBinary = javaHome ? join(javaHome, 'bin/java') : 'java';
  const java = spawnSync(javaBinary, ['-version'], { encoding: 'utf8' });
  const javaMajor = Number((`${java.stderr || ''}${java.stdout || ''}`.match(/version "(\d+)/) || [])[1]);
  if (mode !== 'test-running' && (java.status !== 0 || javaMajor < 21)) {
    console.error('The Firebase database emulator requires a working JDK 21+. Set JAVA_HOME to its home directory and retry. See docs/FIREBASE.md.');
    process.exit(1);
  }
  const env = {
    ...process.env,
    PATH: [dirname(process.execPath), ...(javaHome ? [join(javaHome, 'bin')] : []), process.env.PATH].filter(Boolean).join(process.platform === 'win32' ? ';' : ':'),
    ...(javaHome ? { JAVA_HOME: javaHome } : {}),
    GCLOUD_PROJECT: project,
    GOOGLE_CLOUD_PROJECT: project,
    FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
  };
  let args;
  if (mode === 'test-running') {
    env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
    env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
    const testDirectory = join(root, 'tests/firebase');
    const testFiles = existsSync(testDirectory) ? readdirSync(testDirectory).filter(name => name.endsWith('.test.mjs')).map(name => join(testDirectory, name)) : [];
    if (!testFiles.length) {
      console.error('No Firebase integration tests found in tests/firebase.');
      process.exit(1);
    }
    args = ['--test', ...testFiles];
  } else {
    args = [cli, command, '--only', 'auth,database', '--project', project, '--config', join(root, 'firebase.local.json')];
    if (mode === 'test') args.push('node --test tests/firebase/*.test.mjs');
  }
  console.log(`${mode === 'start' ? 'Starting' : 'Testing'} local Firebase project ${project} with Node ${process.versions.node}${mode === 'test-running' ? '' : ` and Java ${javaMajor}`}.`);
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', env });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('exit', code => process.exit(code ?? 1));
  child.on('error', error => { console.error(error.message); process.exit(1); });
}

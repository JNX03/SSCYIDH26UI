import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, get, set, update, remove, runTransaction, onValue, serverTimestamp } from 'firebase/database';
import { resolveRound } from '../../src/multiplayer-engine.js';

let environment;
const pin = '654321';
const database = uid => uid ? environment.authenticatedContext(uid).database() : environment.unauthenticatedContext().database();
const roomRef = db => ref(db, `rooms/${pin}`);
const legacy = { cold: 21, connection: { online: true, device: 'existing-sensor' }, vibration: { level: 3, lastAt: 1700000000000 } };

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-index-compat',
    database: { host: '127.0.0.1', port: 9000, rules: await readFile(new URL('../../database.index.rules.json', import.meta.url), 'utf8') },
  });
});
beforeEach(async () => { await environment.clearDatabase(); });
after(async () => { await environment?.cleanup(); });

async function createRoom() {
  const host = database('host');
  await set(roomRef(host), { hostId: 'host', createdAt: serverTimestamp(), expiresAt: Date.now() + 3600000, phase: 'lobby', questionIds: ['type-kerning', 'color-contrast'], round: 0, duration: 30, title: 'INDEX design game', startedAt: 0, appearance: { theme: 'forest', motion: false } });
  return host;
}
async function join() {
  const player = database('player');
  await set(ref(player, `rooms/${pin}/players/player`), { name: 'Alex', avatar: 1, joinedAt: serverTimestamp(), connected: true });
  return player;
}

test('INDEX compatibility retains existing sensor reads and writes while game creation leaves their values unchanged', async () => {
  const guest = database();
  for (const [path, value] of Object.entries(legacy)) {
    await assertSucceeds(set(ref(guest, path), value));
    assert.deepEqual((await get(ref(guest, path))).val(), value);
  }
  await createRoom();
  for (const [path, value] of Object.entries(legacy)) assert.deepEqual((await get(ref(guest, path))).val(), value);
  await assertSucceeds(set(ref(guest, 'cold'), 22));
  await assertSucceeds(update(ref(guest, 'connection'), { online: false }));
  await assertSucceeds(set(ref(guest, 'vibration/level'), 4));
  assert.equal((await get(ref(guest, 'cold'))).val(), 22);
  assert.equal((await get(ref(guest, 'connection/online'))).val(), false);
  assert.equal((await get(ref(guest, 'vibration/level'))).val(), 4);
});

test('INDEX retains its prior public read policy while requiring authenticated ownership for new game writes', async () => {
  const host = await createRoom();
  const guest = database();
  await assertSucceeds(get(roomRef(guest)));
  await assertSucceeds(get(ref(guest, 'rooms')));
  assert.equal((await get(roomRef(guest))).val().hostId, 'host');
  await assertFails(set(ref(guest, 'rooms/123456'), { hostId: 'guest' }));
  await assertFails(remove(ref(guest, 'rooms')));
  await assertFails(set(ref(guest, 'new-unscoped-path'), true));
  assert.equal((await get(roomRef(host))).val().phase, 'lobby');
});

test('INDEX players cannot alter game ownership, phases, scores, or their locked answer', async () => {
  const host = await createRoom();
  const player = await join();
  await update(roomRef(host), { phase: 'question', startedAt: serverTimestamp() });
  const answer = ref(player, `rooms/${pin}/answers/0/player`);
  await assertSucceeds(set(answer, { choice: 1, at: serverTimestamp() }));
  await assertFails(set(answer, { choice: 0, at: serverTimestamp() }));
  await assertFails(remove(answer));
  await assertFails(update(roomRef(player), { hostId: 'player' }));
  await assertFails(update(roomRef(player), { phase: 'reveal' }));
  await assertFails(set(ref(player, `rooms/${pin}/scores/player`), { score: 9999, correct: 1, streak: 1, lastPoints: 999 }));
  assert.equal((await get(answer)).val().choice, 1);
  assert.equal((await get(roomRef(host))).val().hostId, 'host');
});

test('INDEX host transactions reveal and score once, then control the next question', async () => {
  const host = await createRoom();
  const player = await join();
  await update(roomRef(host), { phase: 'question', startedAt: serverTimestamp() });
  await set(ref(player, `rooms/${pin}/answers/0/player`), { choice: 1, at: serverTimestamp() });
  let releaseCache;
  await new Promise((resolve, reject) => { releaseCache = onValue(roomRef(host), () => resolve(), reject); });
  try {
  const reveal = current => {
    const next = resolveRound(current, { 'type-kerning': { correct: 1 } });
    return next === current ? undefined : next;
  };
  const first = await assertSucceeds(runTransaction(roomRef(host), reveal, { applyLocally: false }));
  assert.equal(first.committed, true);
  const score = first.snapshot.val().scores.player;
  assert.ok(score.score >= 500 && score.score <= 1000);
  assert.equal(score.correct, 1);
  const second = await assertSucceeds(runTransaction(roomRef(host), reveal, { applyLocally: false }));
  assert.equal(second.committed, false);
  assert.deepEqual(second.snapshot.val().scores.player, score);
  await assertFails(set(ref(player, `rooms/${pin}/answers/1/player`), { choice: 0, at: serverTimestamp() }));
  await assertSucceeds(update(roomRef(host), { phase: 'leaderboard' }));
  await assertFails(update(roomRef(player), { phase: 'question', round: 1, startedAt: serverTimestamp() }));
  await assertSucceeds(update(roomRef(host), { phase: 'question', round: 1, startedAt: serverTimestamp() }));
  await assertSucceeds(set(ref(player, `rooms/${pin}/answers/1/player`), { choice: 0, at: serverTimestamp() }));
  } finally { releaseCache(); }
});


test('INDEX game profiles accept animal 23 and reject animal 24', async () => {
  await createRoom();
  const deer = database('deer-player');
  await assertSucceeds(set(ref(deer, `rooms/${pin}/players/deer-player`), { name: 'เฟิร์น', avatar: 23, joinedAt: serverTimestamp(), connected: true }));
  const invalid = database('invalid-player');
  await assertFails(set(ref(invalid, `rooms/${pin}/players/invalid-player`), { name: 'ผู้เล่น', avatar: 24, joinedAt: serverTimestamp(), connected: true }));
});

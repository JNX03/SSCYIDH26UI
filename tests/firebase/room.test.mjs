import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, get, set, update, remove, serverTimestamp } from 'firebase/database';

let environment;
const pin = '123456';
const database = uid => environment.authenticatedContext(uid).database();
const roomRef = db => ref(db, `rooms/${pin}`);
const player = (name = 'Alex', avatar = 0) => ({ name, avatar, joinedAt: serverTimestamp(), connected: true });

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-design-gym',
    database: { host: '127.0.0.1', port: 9000, rules: await readFile(new URL('../../database.rules.json', import.meta.url), 'utf8') },
  });
});
beforeEach(async () => { await environment.clearDatabase(); });
after(async () => { await environment?.cleanup(); });

async function createRoom() {
  const host = database('host');
  await set(roomRef(host), { hostId: 'host', createdAt: serverTimestamp(), expiresAt: Date.now() + 3600000, phase: 'lobby', questionIds: ['type-kerning', 'color-contrast'], round: 0, duration: 30, title: 'Design Gym Live', startedAt: 0, appearance: { theme: 'purple', motion: true } });
  return host;
}
async function join(uid = 'player') {
  const db = database(uid);
  await set(ref(db, `rooms/${pin}/players/${uid}`), player());
  return db;
}
async function begin(host, round = 0, startedAt = serverTimestamp()) { await update(roomRef(host), { phase: 'question', round, startedAt }); }

test('a host creates a room, authenticated users read its PIN, and root listings stay denied', async () => {
  const host = await createRoom();
  await assertSucceeds(get(roomRef(database('reader'))));
  await assertFails(get(ref(host, 'rooms')));
  await assertFails(get(roomRef(environment.unauthenticatedContext().database())));
  await assertFails(set(roomRef(database('attacker')), { hostId: 'attacker' }));
});

test('room creation validates the owner, PIN, fields, and question bounds', async () => {
  const host = await createRoom();
  const room = (await get(roomRef(host))).val();
  await assertFails(set(ref(database('other'), 'rooms/654321'), { ...room, hostId: 'host', createdAt: serverTimestamp() }));
  await assertFails(set(ref(host, 'rooms/12345'), { ...room, createdAt: serverTimestamp() }));
  await assertFails(set(ref(host, 'rooms/654321'), { ...room, createdAt: serverTimestamp(), questionIds: Array.from({ length: 31 }, (_, index) => `q-${index}`) }));
  await assertFails(update(roomRef(host), { unexpectedAdmin: true }));
  await assertFails(update(roomRef(host), { hostId: 'another-host' }));
});

test('players join only their own profile in an open lobby', async () => {
  const host = await createRoom();
  const db = await join();
  assert.equal((await get(ref(host, `rooms/${pin}/players/player/name`))).val(), 'Alex');
  await assertFails(set(ref(db, `rooms/${pin}/players/victim`), player('Stolen identity')));
  await assertFails(set(ref(host, `rooms/${pin}/players/host`), player('Host player')));
  await begin(host);
  await assertFails(set(ref(database('late-player'), `rooms/${pin}/players/late-player`), player('Late')));
});

test('player profiles enforce name, avatar, server timestamp, and exact fields', async () => {
  await createRoom();
  const db = database('player');
  const path = ref(db, `rooms/${pin}/players/player`);
  for (const value of [player(''), player('a'.repeat(21)), player('<script>'), player('a\nb'), player('a\u0001b'), player('Alex', 24), { ...player(), joinedAt: 1 }, { ...player(), score: 99999 }]) await assertFails(set(path, value));
  await assertSucceeds(set(path, player('นักออกแบบ', 5)));
});

test('players can update their own presence but cannot rename or change others', async () => {
  const host = await createRoom();
  const db = await join();
  await begin(host);
  await assertSucceeds(set(ref(db, `rooms/${pin}/players/player/connected`), false));
  await assertSucceeds(set(ref(db, `rooms/${pin}/players/player/connected`), true));
  await assertFails(update(ref(db, `rooms/${pin}/players/player`), { name: 'New identity' }));
  await assertFails(set(ref(database('other'), `rooms/${pin}/players/player/connected`), false));
});

test('a player may leave the lobby without deleting someone else', async () => {
  await createRoom();
  const db = await join();
  await assertFails(remove(ref(database('other'), `rooms/${pin}/players/player`)));
  await assertSucceeds(remove(ref(db, `rooms/${pin}/players/player`)));
});

test('only registered players may answer during the current question', async () => {
  const host = await createRoom();
  const db = await join();
  const answer = ref(db, `rooms/${pin}/answers/0/player`);
  await assertFails(set(answer, { choice: 1, at: serverTimestamp() }));
  await begin(host);
  await assertSucceeds(set(answer, { choice: 1, at: serverTimestamp() }));
  await assertFails(set(ref(database('outsider'), `rooms/${pin}/answers/0/outsider`), { choice: 1, at: serverTimestamp() }));
});

test('answers lock once and cannot be changed, deleted, or submitted for another player', async () => {
  const host = await createRoom();
  const db = await join();
  await begin(host);
  const answer = ref(db, `rooms/${pin}/answers/0/player`);
  await set(answer, { choice: 1, at: serverTimestamp() });
  await assertFails(set(answer, { choice: 0, at: serverTimestamp() }));
  await assertFails(remove(answer));
  await assertFails(set(ref(database('attacker'), `rooms/${pin}/answers/0/player`), { choice: 0, at: serverTimestamp() }));
});

test('answers validate binary choices and server-issued timestamps', async () => {
  const host = await createRoom();
  const db = await join();
  await begin(host);
  const answer = ref(db, `rooms/${pin}/answers/0/player`);
  for (const choice of [-1, 2, '1', null]) await assertFails(set(answer, { choice, at: serverTimestamp() }));
  await assertFails(set(answer, { choice: 1, at: Date.now() - 5000 }));
  await assertFails(set(answer, { choice: 1, at: serverTimestamp(), score: 1000 }));
  await assertSucceeds(set(answer, { choice: 0, at: serverTimestamp() }));
});

test('answers outside the active round or countdown window are denied', async () => {
  const host = await createRoom();
  const db = await join();
  await begin(host, 1);
  await assertFails(set(ref(db, `rooms/${pin}/answers/0/player`), { choice: 1, at: serverTimestamp() }));
  await update(roomRef(host), { startedAt: Date.now() - 31000 });
  await assertFails(set(ref(db, `rooms/${pin}/answers/1/player`), { choice: 1, at: serverTimestamp() }));
});

test('players cannot control phases or award points, including multipath writes', async () => {
  const host = await createRoom();
  const db = await join();
  const score = { score: 1000, correct: 1, streak: 1, lastPoints: 1000 };
  await assertFails(update(roomRef(db), { phase: 'finished' }));
  await assertFails(set(ref(db, `rooms/${pin}/scores/player`), score));
  await assertFails(update(roomRef(db), { 'players/player/connected': false, 'scores/player': score }));
  assert.equal((await get(ref(host, `rooms/${pin}/players/player/connected`))).val(), true);
  await assertSucceeds(set(ref(host, `rooms/${pin}/scores/player`), score));
});

test('only the host can reveal, show a leaderboard, and close the room', async () => {
  const host = await createRoom();
  const db = await join();
  await begin(host);
  await assertFails(update(roomRef(db), { phase: 'reveal' }));
  for (const phase of ['reveal', 'leaderboard', 'finished', 'closed']) await assertSucceeds(update(roomRef(host), { phase }));
});

test('appearance is shared room data that only the host can edit within its exact schema', async () => {
  const host = await createRoom();
  const db = await join();
  const appearance = ref(host, `rooms/${pin}/appearance`);
  assert.deepEqual((await get(ref(db, `rooms/${pin}/appearance`))).val(), { theme: 'purple', motion: true });
  for (const theme of ['purple', 'midnight', 'coral', 'forest']) await assertSucceeds(set(appearance, { theme, motion: false }));
  await assertFails(set(ref(db, `rooms/${pin}/appearance`), { theme: 'midnight', motion: true }));
  for (const value of [{ theme: 'unknown', motion: true }, { theme: 'purple', motion: 'false' }, { theme: 'purple' }, { theme: 'purple', motion: true, html: '<script>' }]) await assertFails(set(appearance, value));
  assert.deepEqual((await get(ref(db, `rooms/${pin}/appearance`))).val(), { theme: 'forest', motion: false });
});

test('players wait for the host to reveal and advance, and submitted answers remain irreversible', async () => {
  const host = await createRoom();
  const db = await join();
  await begin(host);
  const first = ref(db, `rooms/${pin}/answers/0/player`);
  await set(first, { choice: 1, at: serverTimestamp() });
  await assertFails(update(roomRef(db), { phase: 'reveal' }));
  await assertSucceeds(update(roomRef(host), { phase: 'reveal' }));
  await assertFails(set(first, { choice: 0, at: serverTimestamp() }));
  await assertFails(remove(first));
  await assertFails(set(ref(db, `rooms/${pin}/answers/1/player`), { choice: 1, at: serverTimestamp() }));
  await assertFails(update(roomRef(db), { phase: 'question', round: 1, startedAt: serverTimestamp() }));
  await assertSucceeds(begin(host, 1));
  await assertSucceeds(set(ref(db, `rooms/${pin}/answers/1/player`), { choice: 0, at: serverTimestamp() }));
  assert.equal((await get(first)).val().choice, 1);
});

test('expired rooms cannot be read, joined, or modified', async () => {
  const host = await createRoom();
  const room = (await get(roomRef(host))).val();
  await environment.withSecurityRulesDisabled(async context => set(roomRef(context.database()), { ...room, expiresAt: Date.now() - 1000 }));
  await assertFails(get(roomRef(database('reader'))));
  await assertFails(set(ref(database('player'), `rooms/${pin}/players/player`), player()));
  await assertFails(update(roomRef(host), { phase: 'closed' }));
});


test('all 24 animal avatar indices are accepted and out-of-range values are denied', async () => {
  await createRoom();
  for (let avatar = 0; avatar < 24; avatar += 1) {
    const uid = `animal-${avatar}`;
    await assertSucceeds(set(ref(database(uid), `rooms/${pin}/players/${uid}`), player('ผู้เล่น', avatar)));
  }
  for (const [index, avatar] of [-1, 24, 1.5, '23'].entries()) {
    const uid = `invalid-animal-${index}`;
    await assertFails(set(ref(database(uid), `rooms/${pin}/players/${uid}`), player('ผู้เล่น', avatar)));
  }
});

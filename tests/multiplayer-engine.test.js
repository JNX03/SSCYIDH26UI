import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNickname, normalizePin, normalizeAppearance, shouldEndRound, scoreAnswer, rankPlayers, buildRoomQuestionIds, resolveRound } from '../src/multiplayer-engine.js';

test('player nicknames are normalized and stay within the database constraints', () => {
  assert.deepEqual(validateNickname('  Alex   Morgan  '), { valid: true, name: 'Alex Morgan', error: '' });
  assert.equal(validateNickname('นักออกแบบ').valid, true);
  for (const name of ['', '   ', '<script>', 'a\nb', 'a'.repeat(21), null]) assert.equal(validateNickname(name).valid, false, String(name));
  assert.equal(validateNickname('a'.repeat(20)).valid, true);
});

test('game PINs accept pasted spacing but reject incomplete or nonnumeric values', () => {
  assert.equal(normalizePin('123 456'), '123456');
  assert.equal(normalizePin('123-456'), '123456');
  assert.equal(normalizePin(123456), '123456');
  for (const pin of ['', '12345', '1234567', '12a456', null]) assert.equal(normalizePin(pin), '');
});

test('room appearance keeps supported themes and provides safe shared defaults', () => {
  assert.deepEqual(normalizeAppearance(), { theme: 'purple', motion: true });
  for (const theme of ['purple', 'midnight', 'coral', 'forest']) assert.deepEqual(normalizeAppearance({ theme, motion: false }), { theme, motion: false });
  assert.deepEqual(normalizeAppearance({ theme: '<script>', motion: 'false' }), { theme: 'purple', motion: true });
  assert.deepEqual(normalizeAppearance(null), { theme: 'purple', motion: true });
});

test('correct speed scores range from 1000 to 500 and wrong answers score zero', () => {
  assert.equal(scoreAnswer(true, 0, 30000), 1000);
  assert.equal(scoreAnswer(true, 15000, 30000), 750);
  assert.equal(scoreAnswer(true, 30000, 30000), 500);
  assert.equal(scoreAnswer(true, -500, 30000), 1000);
  assert.equal(scoreAnswer(true, 999999, 30000), 500);
  assert.equal(scoreAnswer(false, 0, 30000), 0);
  for (const [elapsed, duration] of [[NaN, 30000], [10, 0], [10, Infinity]]) assert.equal(scoreAnswer(true, elapsed, duration), 0);
});

test('room question selection is unique, topic-aware, bounded, and reproducible', () => {
  const questions = Array.from({ length: 40 }, (_, index) => ({ id: `q${index}`, topic: index % 2 ? 'type' : 'color' }));
  const first = buildRoomQuestionIds([...questions, questions[0]], 'all', 10, () => 0.5);
  assert.equal(first.length, 10);
  assert.equal(new Set(first).size, 10);
  assert.deepEqual(first, buildRoomQuestionIds(questions, 'all', 10, () => 0.5));
  assert.equal(buildRoomQuestionIds(questions, 'all', 100).length, 30);
  const filtered = buildRoomQuestionIds(questions, 'type', 30);
  assert.equal(filtered.length, 20);
  assert.ok(filtered.every(id => questions.find(question => question.id === id).topic === 'type'));
  assert.deepEqual(buildRoomQuestionIds(questions, 'missing', 10), []);
  assert.deepEqual(buildRoomQuestionIds([], 'all', 10), []);
});

const roomFixture = () => ({
  hostId: 'host', phase: 'question', questionIds: ['kerning'], round: 0, duration: 30, startedAt: 100000,
  players: { fast: { name: 'Alex', avatar: 0 }, slow: { name: 'Sam', avatar: 1 }, wrong: { name: 'Maya', avatar: 2 }, absent: { name: 'Lee', avatar: 3 } },
  answers: { 0: { fast: { choice: 1, at: 100000 }, slow: { choice: 1, at: 115000 }, wrong: { choice: 0, at: 100100 } } },
  scores: { fast: { score: 500, correct: 1, streak: 1, lastPoints: 500 }, wrong: { score: 500, correct: 1, streak: 1, lastPoints: 500 } },
});

test('a round ends early only after every active player has committed a valid current answer', () => {
  const room = roomFixture();
  assert.equal(shouldEndRound(room), false, 'A player is still thinking');
  room.answers[0].absent = { choice: 0, at: 116000 };
  assert.equal(shouldEndRound(room), true, 'Wrong answers still count as submitted');
  room.players.host = { name: 'Host', connected: true };
  assert.equal(shouldEndRound(room), true, 'The host is excluded from player quorum');
  delete room.answers[0].absent;
  room.players.absent.connected = false;
  assert.equal(shouldEndRound(room), true, 'A disconnected player does not block the active group');
  room.players.absent.connected = true;
  assert.equal(shouldEndRound(room), false, 'A player reconnecting before reveal must answer');
});

test('round quorum ignores old answers, pending or invalid timestamps, and inactive phases', () => {
  const room = roomFixture();
  room.players = { fast: { name: 'Alex', connected: true } };
  for (const answer of [{ choice: '1', at: 100100 }, { choice: 1, at: NaN }, { choice: 1, at: 99999 }, { choice: 1, at: 130001 }]) {
    room.answers[0].fast = answer;
    assert.equal(shouldEndRound(room), false);
  }
  room.answers = { 1: { fast: { choice: 1, at: 100100 } } };
  assert.equal(shouldEndRound(room), false, 'An earlier or later round cannot satisfy quorum');
  room.answers = {};
  assert.equal(shouldEndRound(room), false, 'No answers means the host keeps waiting');
  room.answers = { 0: { fast: { choice: 1, at: 100100 } } };
  for (const phase of ['lobby', 'reveal', 'leaderboard', 'finished', 'closed']) assert.equal(shouldEndRound({ ...room, phase }), false);
  assert.equal(shouldEndRound({ ...room, players: {} }), false);
  assert.equal(shouldEndRound({ ...room, players: { fast: { name: 'Alex', connected: false } } }), false);
  assert.equal(shouldEndRound(room), true);
});

test('host reveal scores accepted server timestamps and resets wrong or missing streaks', () => {
  const room = roomFixture();
  const original = structuredClone(room);
  const revealed = resolveRound(room, { kerning: { correct: 1 } });
  assert.deepEqual(room, original);
  assert.equal(revealed.phase, 'reveal');
  assert.deepEqual(revealed.scores.fast, { score: 1500, correct: 2, streak: 2, lastPoints: 1000 });
  assert.deepEqual(revealed.scores.slow, { score: 750, correct: 1, streak: 1, lastPoints: 750 });
  assert.deepEqual(revealed.scores.wrong, { score: 500, correct: 1, streak: 0, lastPoints: 0 });
  assert.deepEqual(revealed.scores.absent, { score: 0, correct: 0, streak: 0, lastPoints: 0 });
});

test('revealing a round repeatedly cannot add points twice', () => {
  const revealed = resolveRound(roomFixture(), new Map([['kerning', { correct: 1 }]]));
  assert.equal(resolveRound(revealed, { kerning: { correct: 1 } }), revealed);
  assert.equal(resolveRound({ ...revealed, phase: 'leaderboard' }, { kerning: { correct: 1 } }).scores.fast.score, 1500);
});

test('late, pre-start, and malformed timestamps cannot earn points', () => {
  const room = roomFixture();
  room.answers[0] = { fast: { choice: 1, at: 130001 }, slow: { choice: 1, at: 99999 }, wrong: { choice: 1, at: '100000' } };
  const revealed = resolveRound(room, { kerning: { correct: 1 } });
  for (const uid of Object.keys(room.players)) assert.equal(revealed.scores[uid].lastPoints, 0);
  room.answers[0].fast.at = 130000;
  assert.equal(resolveRound(room, { kerning: { correct: 1 } }).scores.fast.lastPoints, 500);
});

test('missing questions and invalid rounds do not produce a false reveal', () => {
  const room = roomFixture();
  assert.equal(resolveRound(room, {}), room);
  assert.equal(resolveRound(room, { kerning: { correct: 2 } }), room);
  assert.equal(resolveRound({ ...room, duration: 0 }, { kerning: { correct: 1 } }).phase, 'question');
});

test('leaderboards rank scores consistently, preserve ties, and exclude the host', () => {
  const room = roomFixture();
  room.players.host = { name: 'Host', avatar: 0 };
  room.scores = { fast: { score: 1000, correct: 1 }, slow: { score: 1000, correct: 1 }, wrong: { score: 500, correct: 1 }, host: { score: 99999 } };
  const ranked = rankPlayers(room);
  assert.deepEqual(ranked.map(player => player.uid), ['fast', 'slow', 'wrong', 'absent']);
  assert.deepEqual(ranked.map(player => player.rank), [1, 1, 3, 4]);
  assert.equal(ranked[3].score, 0);
  assert.deepEqual(rankPlayers(null), []);
});

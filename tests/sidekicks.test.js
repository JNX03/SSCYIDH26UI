import test from 'node:test';
import assert from 'node:assert/strict';
import { sidekicks, renderSidekick } from '../src/sidekicks.js';
import { avatarIds, normalizeAvatar } from '../src/realtime.js';

const safeSvg = (markup, requireHidden = true) => {
  assert.equal(typeof markup, 'string');
  assert.match(markup, /<svg\b[^>]*viewBox=["']0 0 128 128["']/i);
  if (requireHidden) assert.match(markup, /aria-hidden=["']true["']/i);
  assert.doesNotMatch(markup, /<(?:script|iframe|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=\s*["'](?!#)[^"']+/i);
  assert.doesNotMatch(markup, /undefined|\[object Object\]|NaN/);
};

test('24 distinct animal sidekicks retain the original six numeric avatar identities', () => {
  assert.equal(sidekicks.length, 24);
  assert.deepEqual(sidekicks.slice(0, 6).map(sidekick => sidekick.id), ['fox', 'bunny', 'panda', 'frog', 'cat', 'penguin']);
  for (const field of ['id', 'name', 'animal', 'svg']) assert.equal(new Set(sidekicks.map(sidekick => sidekick[field])).size, 24, field);
  for (const sidekick of sidekicks) {
    for (const field of ['name', 'animal', 'label', 'nameTh', 'animalTh', 'labelTh', 'color']) assert.ok(typeof sidekick[field] === 'string' && sidekick[field].trim(), `${sidekick.id}.${field}`);
    for (const field of ['nameTh', 'animalTh', 'labelTh']) assert.match(sidekick[field], /[ก-๙]/u, `${sidekick.id}.${field}`);
    assert.ok(sidekick.svg.match(/<g class="sk-face">[\s\S]+<\/g>/)?.[0].length > 400, `${sidekick.id} has a complete animal illustration`);
    safeSvg(sidekick.svg, false);
  }
});

test('all 72 animal and mood combinations render self-contained safe SVG', () => {
  for (const [index, sidekick] of sidekicks.entries()) {
    for (const mood of ['idle', 'happy', 'thinking']) {
      safeSvg(renderSidekick(index, mood));
      assert.equal(renderSidekick(sidekick.id, mood), renderSidekick(index, mood));
    }
  }
});

test('unknown avatars and moods fall back without rendering supplied markup', () => {
  const fallback = renderSidekick(0, 'idle');
  for (const value of [-1, 24, 1.5, NaN, null, {}, 'unknown', '<script>']) assert.equal(renderSidekick(value), fallback);
  assert.equal(renderSidekick(2, '<img onerror=alert(1)>'), renderSidekick(2, 'idle'));
  safeSvg(renderSidekick('<script>', '<script>'));
});


test('room avatar normalization accepts the full catalog and preserves legacy color aliases', () => {
  assert.deepEqual(avatarIds, sidekicks.map(sidekick => sidekick.id));
  for (const [index, sidekick] of sidekicks.entries()) {
    assert.equal(normalizeAvatar(index), index);
    assert.equal(normalizeAvatar(sidekick.id), index);
    assert.equal(normalizeAvatar(String(index)), index);
  }
  for (const [index, legacy] of ['violet', 'peach', 'mint', 'sky', 'rose', 'lemon'].entries()) assert.equal(normalizeAvatar(legacy), index);
  assert.equal(normalizeAvatar(23), 23);
  for (const value of [24, -1, 1.5, NaN, null, {}, '24', 'unknown', '<script>']) assert.throws(() => normalizeAvatar(value), { code: 'live/invalid-avatar' });
});

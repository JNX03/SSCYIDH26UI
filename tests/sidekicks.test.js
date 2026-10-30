import test from 'node:test';
import assert from 'node:assert/strict';
import { sidekicks, renderSidekick } from '../src/sidekicks.js';

const safeSvg = (markup, requireHidden = true) => {
  assert.equal(typeof markup, 'string');
  assert.match(markup, /<svg\b[^>]*viewBox=["']0 0 128 128["']/i);
  if (requireHidden) assert.match(markup, /aria-hidden=["']true["']/i);
  assert.doesNotMatch(markup, /<(?:script|iframe|foreignObject)\b|\bon\w+\s*=|\b(?:href|src)\s*=\s*["'](?!#)[^"']+/i);
  assert.doesNotMatch(markup, /undefined|\[object Object\]|NaN/);
};

test('six distinct animal sidekicks retain their stable numeric avatar order', () => {
  assert.deepEqual(sidekicks.map(sidekick => sidekick.id), ['fox', 'bunny', 'panda', 'frog', 'cat', 'penguin']);
  for (const field of ['id', 'name', 'animal', 'svg']) assert.equal(new Set(sidekicks.map(sidekick => sidekick[field])).size, 6, field);
  for (const sidekick of sidekicks) {
    for (const field of ['name', 'animal', 'label', 'color']) assert.ok(typeof sidekick[field] === 'string' && sidekick[field].trim(), `${sidekick.id}.${field}`);
    safeSvg(sidekick.svg, false);
  }
});

test('all 18 animal and mood combinations render self-contained safe SVG', () => {
  for (const [index, sidekick] of sidekicks.entries()) {
    for (const mood of ['idle', 'happy', 'thinking']) {
      safeSvg(renderSidekick(index, mood));
      assert.equal(renderSidekick(sidekick.id, mood), renderSidekick(index, mood));
    }
  }
});

test('unknown avatars and moods fall back without rendering supplied markup', () => {
  const fallback = renderSidekick(0, 'idle');
  for (const value of [-1, 6, NaN, null, {}, 'unknown', '<script>']) assert.equal(renderSidekick(value), fallback);
  assert.equal(renderSidekick(2, '<img onerror=alert(1)>'), renderSidekick(2, 'idle'));
  safeSvg(renderSidekick('<script>', '<script>'));
});

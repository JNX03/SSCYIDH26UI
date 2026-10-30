import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges } from '../src/challenges.js';
import { renderVisual } from '../src/visuals.js';

test('all visual exercises render different examples for their two answer choices', () => {
  for (const challenge of challenges) {
    const examples = challenge.options.map((_, index) => renderVisual(challenge, index));
    for (const html of examples) {
      assert.equal(typeof html, 'string', challenge.id);
      assert.ok(html.trim().length > 80, `${challenge.id} must render a meaningful visual`);
      assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/, challenge.id);
      assert.doesNotMatch(html, /<(?:button|input|select|textarea|a)\b/i, `${challenge.id} cannot nest interactive controls inside its answer button`);
    }
    assert.notEqual(examples[0], examples[1], `${challenge.id} needs visibly different choices`);
  }
});

test('compact theory illustrations render for all exercises', () => {
  for (const challenge of challenges) {
    const html = renderVisual(challenge, challenge.correct, true);
    assert.ok(html && typeof html === 'string', challenge.id);
    assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/, challenge.id);
  }
});

test('the catalog includes at least twenty distinct visual exercise types', () => {
  assert.ok(new Set(challenges.map(challenge => challenge.visual)).size >= 20);
  assert.ok(new Set(challenges.map(challenge => renderVisual(challenge, challenge.correct))).size >= 20);
});

test('key teaching examples demonstrate the principle named in their question', () => {
  const examples = id => {
    const challenge = challenges.find(item => item.id === id);
    assert.ok(challenge, id);
    return [renderVisual(challenge, challenge.correct), renderVisual(challenge, 1 - challenge.correct)];
  };

  const [reversible, irreversible] = examples('ux-recovery');
  assert.match(reversible, /Undo/);
  assert.doesNotMatch(irreversible, /Undo/);

  const [explicitStatus, colorOnly] = examples('color-meaning');
  assert.match(explicitStatus, /Payment successful/);
  assert.doesNotMatch(colorOnly, /Payment successful/);

  const [specificAction, vagueAction] = examples('content-action');
  const firstAction = html => html.match(/class="vg-btn[^"]*">([^<]+)/)?.[1];
  assert.notEqual(firstAction(specificAction), firstAction(vagueAction), 'The action-label exercise must change its button wording');

  const [specificHeading, vagueHeading] = examples('content-heading');
  const title = html => html.match(/class="vg-type-title">([\s\S]*?)<\/strong>/)?.[1];
  assert.notEqual(title(specificHeading), title(vagueHeading), 'The descriptive-heading exercise must change its heading wording');

  const [helpfulFilename] = examples('content-truncation');
  assert.match(helpfulFilename, /…[^<]*\.pdf/);
  assert.match(helpfulFilename, /title="[^"]+\.pdf"/, 'The complete filename must remain available');

  const [success] = examples('component-state');
  assert.match(success, /Payment successful/);
  assert.match(success, /receipt/);
});

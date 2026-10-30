import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges, topics } from '../src/challenges.js';

test('catalog provides 64 unique exercises with eight per topic', () => {
  assert.equal(topics.length, 8);
  assert.equal(challenges.length, 64);
  assert.equal(new Set(topics.map(topic => topic.id)).size, topics.length);
  assert.equal(new Set(challenges.map(challenge => challenge.id)).size, challenges.length);
  assert.equal(new Set(challenges.map(challenge => challenge.prompt)).size, challenges.length);

  for (const topic of topics) {
    assert.equal(challenges.filter(challenge => challenge.topic === topic.id).length, 8, topic.id);
    for (const field of ['id', 'label', 'shortLabel', 'description']) {
      assert.equal(typeof topic[field], 'string', `${topic.id}.${field}`);
      assert.ok(topic[field].trim().length > 0, `${topic.id}.${field} must have content`);
    }
  }
});

test('every exercise has a complete binary answer and useful theory', () => {
  for (const challenge of challenges) {
    assert.ok(topics.some(topic => topic.id === challenge.topic), challenge.id);
    assert.equal(challenge.options.length, 2, `${challenge.id} needs two options`);
    assert.ok(challenge.correct === 0 || challenge.correct === 1, challenge.id);
    assert.ok(['Beginner', 'Intermediate'].includes(challenge.difficulty), challenge.id);
    for (const field of ['title', 'prompt', 'principle', 'explanation', 'takeaway', 'visual']) {
      assert.equal(typeof challenge[field], 'string', `${challenge.id}.${field}`);
      assert.ok(challenge[field].trim().length > 0, `${challenge.id}.${field} must have content`);
    }
    assert.ok(challenge.explanation.trim().split(/\s+/).length >= 25, `${challenge.id} needs a substantive explanation`);
    for (const option of challenge.options) {
      assert.ok(option.label?.trim(), `${challenge.id} needs an accessible option label`);
      assert.ok(option.variant?.trim(), `${challenge.id} needs a visual variant`);
    }
    assert.notEqual(challenge.options[0].variant, challenge.options[1].variant, `${challenge.id} must compare different examples`);
  }
});

test('first challenge matches the supplied kerning reference', () => {
  assert.equal(challenges[0].prompt, 'Which example shows kerning?');
  assert.equal(challenges[0].visual, 'kerning');
  assert.deepEqual(challenges[0].options.map(option => option.variant), ['tracking', 'kerning']);
  assert.equal(challenges[0].correct, 1);
});

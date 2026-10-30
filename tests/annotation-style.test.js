import test from 'node:test';
import assert from 'node:assert/strict';
import { getAnnotationStyle, getAnswerInsight, renderAnnotatedVisual } from '../src/answer-insights.js';
import { challenges } from '../src/challenges.js';
import { bonusChallenges } from '../src/bonus.js';
import { designChallenges } from '../src/design-challenges.js';
import { courseChallenges } from '../src/course.js';

test('only letter gaps and color-wheel points receive an extra teaching circle', () => {
  for (const feature of ['letter-pair', 'wheel-hues']) assert.equal(getAnnotationStyle(feature), 'circle', feature);
  for (const feature of ['scenario-detail', 'card-padding', 'cost-breakdown', 'field-groups', 'line-height', 'line-length', 'type-hierarchy', 'common-regions', 'tap-target', 'close-target', 'unknown', undefined]) {
    assert.equal(getAnnotationStyle(feature), 'highlight', String(feature));
  }
});

test('all revealed examples declare the feature-specific mark without altering their answer targets', () => {
  for (const question of [...challenges, ...bonusChallenges, ...designChallenges, ...courseChallenges]) {
    const feature = getAnswerInsight(question).key;
    const expected = ['letter-pair', 'wheel-hues'].includes(feature) ? 'circle' : 'highlight';
    for (const index of [0, 1]) {
      const html = renderAnnotatedVisual(question, index, true);
      assert.match(html, new RegExp(`data-ai-mark="${expected}"`), `${question.id} option ${index}`);
      assert.match(html, /data-ai-targets="[1-9]\d*"/, question.id);
      assert.match(html, new RegExp(`data-ai-feature="${feature}"`), question.id);
    }
  }
});

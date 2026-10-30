import test from 'node:test';
import assert from 'node:assert/strict';
import { designChallenges } from '../src/design-challenges.js';
import { renderDesignVisual } from '../src/design-visuals.js';

test('the additional visual bank has 24 original exercises with balanced topics and answers', () => {
  assert.equal(designChallenges.length, 24);
  assert.equal(new Set(designChallenges.map(question => question.id)).size, 24);
  assert.equal(new Set(designChallenges.map(question => question.prompt)).size, 24);
  assert.equal(designChallenges.filter(question => question.topic === 'color').length, 12);
  assert.equal(designChallenges.filter(question => ['ux', 'layout', 'components'].includes(question.topic)).length, 12);
  assert.equal(designChallenges.filter(question => question.correct === 0).length, 12);
  assert.equal(designChallenges.filter(question => question.correct === 1).length, 12);
});

test('each additional exercise has complete theory and two distinct graded visual choices', () => {
  for (const question of designChallenges) {
    for (const field of ['id', 'title', 'topic', 'prompt', 'difficulty', 'principle', 'explanation', 'takeaway', 'visual']) {
      assert.ok(typeof question[field] === 'string' && question[field].trim(), `${question.id}.${field}`);
    }
    assert.ok(question.visual.startsWith('design-'), question.id);
    assert.ok(['Beginner', 'Intermediate'].includes(question.difficulty), question.id);
    const words = question.explanation.trim().split(/\s+/).length;
    assert.ok(words >= 40 && words <= 60, `${question.id} explanation has ${words} words`);
    assert.equal(question.options.length, 2, question.id);
    assert.equal(question.options[question.correct].variant, 'good', question.id);
    assert.equal(question.options[1 - question.correct].variant, 'bad', question.id);
    for (const option of question.options) assert.ok(option.label?.trim(), question.id);
  }
});

test('all 48 additional visual variants render meaningful safe HTML', () => {
  for (const question of designChallenges) {
    const pair = question.options.map((_, index) => {
      const html = renderDesignVisual(question, index);
      assert.ok(typeof html === 'string' && html.length > 80, `${question.id} option ${index}`);
      assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/, question.id);
      assert.doesNotMatch(html, /<(?:script|button|input|select|textarea|a)\b|\bon\w+\s*=/i, question.id);
      return html;
    });
    assert.notEqual(pair[0], pair[1], `${question.id} must display different alternatives`);
  }
});

test('the additional renderer leaves unsupported visuals to the main renderer', () => {
  assert.equal(renderDesignVisual({ visual: 'unsupported', options: [{ variant: 'good' }, { variant: 'bad' }] }, 0), null);
});

const correctOption = id => {
  const question = designChallenges.find(item => item.id === id);
  assert.ok(question, id);
  return question.options[question.correct];
};

test('color-wheel answers depict the named hue relationships mathematically', () => {
  const marks = suffix => correctOption(`design-color-${suffix}`).marks;
  assert.deepEqual(marks('primary'), [0, 4, 8]);
  assert.deepEqual(marks('secondary'), [2, 6, 10]);
  assert.deepEqual(marks('tertiary'), [1, 3, 5, 7, 9, 11]);
  const complementary = marks('complement');
  assert.equal(complementary.length, 2);
  assert.equal((complementary[1] - complementary[0] + 12) % 12, 6);
  const analogous = marks('analogous');
  assert.equal(analogous.length, 3);
  assert.ok(analogous.some(base => [base, (base + 1) % 12, (base + 2) % 12].every(hue => analogous.includes(hue))));
  const triadic = [...marks('triadic')].sort((a, b) => a - b);
  assert.equal(triadic.length, 3);
  assert.ok(triadic.every((hue, index) => (triadic[(index + 1) % 3] - hue + 12) % 12 === 4));
  const split = marks('split');
  assert.equal(split.length, 3);
  assert.ok(split.some(base => split.includes((base + 5) % 12) && split.includes((base + 7) % 12)));
  const tetradic = marks('tetradic');
  assert.equal(new Set(tetradic).size, 4);
  assert.ok(tetradic.every(hue => tetradic.includes((hue + 6) % 12)));
});

function hsl(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i);
  const [red, green, blue] = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const high = Math.max(red, green, blue), low = Math.min(red, green, blue), delta = high - low;
  const lightness = (high + low) / 2;
  let hue = 0;
  if (delta) {
    hue = high === red ? (green - blue) / delta : high === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { hue, saturation: delta ? delta / (1 - Math.abs(2 * lightness - 1)) * 100 : 0, lightness: lightness * 100 };
}
const hueDistance = (first, second) => Math.min((first - second + 360) % 360, (second - first + 360) % 360);

test('saturation and tint illustrations preserve their hue rather than teaching a color-family change', () => {
  const saturation = correctOption('design-color-saturation').colors.map(hsl);
  assert.equal(saturation.length, 3);
  assert.ok(saturation.every(color => hueDistance(color.hue, saturation[0].hue) <= 1));
  assert.ok(saturation.every(color => Math.abs(color.lightness - saturation[0].lightness) <= 0.5));
  assert.ok(saturation[0].saturation < saturation[1].saturation && saturation[1].saturation < saturation[2].saturation);
  const [tint, base, shade] = correctOption('design-color-tintshade').colors.map(hsl);
  assert.ok(tint.lightness > base.lightness && base.lightness > shade.lightness);
  assert.ok(hueDistance(tint.hue, base.hue) <= 1);
  assert.ok(hueDistance(shade.hue, base.hue) <= 1);
});

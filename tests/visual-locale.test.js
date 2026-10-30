import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges } from '../src/challenges.js';
import { bonusChallenges } from '../src/bonus.js';
import { designChallenges } from '../src/design-challenges.js';
import { courseChallenges } from '../src/course.js';
import { renderVisual } from '../src/visuals.js';
import { visualThai } from '../src/locales/visuals.th.js';

const bank = [...bonusChallenges, ...challenges, ...designChallenges, ...courseChallenges];
const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

test('Thai covers static visible mockups and accessible labels across the full question bank', () => {
  const dynamic = new Set(bank.flatMap(question => [question.prompt, question.title, question.principle, question.explanation, question.takeaway, ...question.options.flatMap(option => [option.label, option.heading, option.detail])]).filter(Boolean).map(value => value.trim()));
  const missing = new Set();
  for (const question of bank) for (const index of [0, 1]) {
    const html = renderVisual(question, index);
    const strings = [...html.matchAll(/>([^<>]+)</g), ...html.matchAll(/(?:aria-label|title|placeholder)="([^"]+)"/g)].map(match => decode(match[1]).trim());
    for (const value of strings) {
      if (!/[A-Za-z]/.test(value) || dynamic.has(value) || value.includes('@') || /^[A-Za-z]$/.test(value)) continue;
      if (!Object.hasOwn(visualThai, value)) missing.add(value);
    }
  }
  assert.deepEqual([...missing], []);
});

test('Thai mockup translations preserve only intentional letters, codes, units, and domains', () => {
  const technical = new Set(['Aa', 'Ag', 'arc.', 'km', 'little-studio', 'studio.space', 'v1.0', '⌘ K']);
  assert.ok(Object.keys(visualThai).length >= 350);
  for (const [source, translated] of Object.entries(visualThai)) {
    assert.ok(typeof translated === 'string' && translated.trim(), source);
    if (/^#[A-Fa-f0-9]{6}$/.test(source) || technical.has(source)) assert.equal(translated, source);
    else assert.match(translated, /[ก-๙]/u, source);
  }
});

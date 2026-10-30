import test from 'node:test';
import assert from 'node:assert/strict';
import { courseLevels, courseChallenges } from '../src/course.js';
import { challenges, topics } from '../src/challenges.js';
import { renderVisual } from '../src/visuals.js';

const lessons = courseLevels.flatMap(level => level.lessons);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

test('the course offers six levels, 25 unique lessons, and 100 original questions', () => {
  assert.equal(courseLevels.length, 6);
  assert.equal(lessons.length, 25);
  assert.equal(courseChallenges.length, 100);
  assert.equal(new Set(courseLevels.map(level => level.id)).size, 6);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, 25);
  assert.equal(new Set(courseChallenges.map(question => question.id)).size, 100);
  assert.equal(new Set([...challenges, ...courseChallenges].map(question => question.id)).size, 164);
  for (const level of courseLevels) {
    assert.ok(level.lessons.length > 0, `${level.id} must contain lessons`);
    assert.ok(level.title?.trim(), `${level.id} must have a title`);
    assert.ok(level.description?.trim(), `${level.id} must have a description`);
  }
});

test('each course question belongs to exactly one lesson and every lesson has four questions', () => {
  const lessonIds = new Set(lessons.map(lesson => lesson.id));
  for (const question of courseChallenges) {
    assert.ok(lessonIds.has(question.lessonId), `${question.id} references a known lesson`);
  }
  const grouped = lessons.map(lesson => courseChallenges.filter(question => question.lessonId === lesson.id));
  for (const [index, questions] of grouped.entries()) {
    const lesson=lessons[index];
    assert.ok(lesson.title?.trim(), `${lesson.id} must have a title`);
    assert.ok(lesson.description?.trim(), `${lesson.id} must have a description`);
    assert.equal(questions.length, 4, `${lesson.id} must have four questions`);
    assert.equal(lesson.challengeIds.length, 4, `${lesson.id} must reference four questions`);
    assert.equal(new Set(lesson.challengeIds).size, 4, `${lesson.id} cannot repeat a question`);
    assert.deepEqual([...lesson.challengeIds].sort(),questions.map(question=>question.id).sort(), `${lesson.id} references must match its question records`);
  }
  assert.deepEqual(grouped.flat().map(question => question.id).sort(), courseChallenges.map(question => question.id).sort());
});

test('course questions contain distinct scenarios and consistently identify their correct option', () => {
  for (const question of courseChallenges) {
    assert.equal(question.visual, 'course-concept', question.id);
    assert.ok(topics.some(topic=>topic.id===question.topic), `${question.id} must use a known topic`);
    assert.ok(['Beginner','Intermediate'].includes(question.difficulty), `${question.id} must have a supported difficulty`);
    assert.ok(question.prompt?.trim(), question.id);
    assert.ok(question.title?.trim(), question.id);
    assert.ok(question.principle?.trim(), question.id);
    assert.ok(question.explanation?.trim(), question.id);
    assert.ok(question.takeaway?.trim(), question.id);
    assert.equal(question.options.length, 2, question.id);
    assert.ok(question.correct === 0 || question.correct === 1, question.id);
    assert.equal(question.options[question.correct].variant, 'good', question.id);
    assert.equal(question.options[1 - question.correct].variant, 'bad', question.id);
    for (const option of question.options) {
      for (const field of ['label', 'heading', 'detail', 'symbol']) {
        assert.ok(typeof option[field] === 'string' && option[field].trim().length > 0, `${question.id}.${field}`);
      }
    }
    assert.notEqual(`${question.options[0].heading}\n${question.options[0].detail}`, `${question.options[1].heading}\n${question.options[1].detail}`, `${question.id} needs distinct scenarios`);
  }
});

test('all 100 course questions render both complete scenario descriptions without nested controls', () => {
  for (const question of courseChallenges) {
    const rendered = question.options.map((option, index) => {
      const html = renderVisual(question, index);
      assert.ok(html.includes(escapeHtml(option.heading)), `${question.id} must show the scenario heading`);
      assert.ok(html.includes(escapeHtml(option.detail)), `${question.id} must show the scenario detail`);
      assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/, question.id);
      assert.doesNotMatch(html, /<(?:button|input|select|textarea|a)\b/i, question.id);
      assert.ok(renderVisual(question, index, true).length > 100, question.id);
      return html;
    });
    assert.notEqual(rendered[0], rendered[1], question.id);
  }
});

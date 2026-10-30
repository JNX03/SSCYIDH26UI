import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialProgress, loadProgress } from '../src/engine.js';
import { getCourseProgress, completeCourseSession, canTakeLevelTest, buildLevelTest } from '../src/course-engine.js';

const levels = Array.from({ length: 6 }, (_, level) => ({
  id: `level-${level}`,
  lessons: Array.from({ length: level === 5 ? 5 : 4 }, (_, lesson) => ({ id: `level-${level}-lesson-${lesson}` })),
}));
const questions = levels.flatMap(level => level.lessons.flatMap(lesson => Array.from({ length: 4 }, (_, index) => ({
  id: `${lesson.id}-${index}`, lessonId: lesson.id, correct: index % 2,
}))));
const answers = (...correct) => correct.map(value => ({ correct: value }));

test('course progress starts with 25 available lessons and six tests', () => {
  assert.deepEqual(getCourseProgress(createInitialProgress(), levels), {
    completedLessons: 0, passedTests: 0, totalLessons: 25, totalTests: 6, percent: 0,
  });
  assert.deepEqual(getCourseProgress({}, []), {
    completedLessons: 0, passedTests: 0, totalLessons: 0, totalTests: 0, percent: 0,
  });
});

test('a lesson completes at 75%, with immutable progress and truthful attempt counts', () => {
  const initial = createInitialProgress();
  const original = structuredClone(initial);
  const context = { type: 'lesson', id: levels[0].lessons[0].id };
  const failed = completeCourseSession(initial, context, answers(true, true, false, false));
  assert.deepEqual(initial, original);
  assert.deepEqual(failed.course.lessons[context.id], { completed: false, bestScore: 50, attempts: 1 });
  const passed = completeCourseSession(failed, context, answers(true, true, true, false));
  assert.deepEqual(passed.course.lessons[context.id], { completed: true, bestScore: 75, attempts: 2 });
  const retaken = completeCourseSession(passed, context, answers(false, false, false, false));
  assert.deepEqual(retaken.course.lessons[context.id], { completed: true, bestScore: 75, attempts: 3 });
  assert.equal(getCourseProgress(retaken, levels).completedLessons, 1);
});

test('a level test requires 80%, and later failures preserve an earned pass and best score', () => {
  const context = { type: 'test', id: levels[0].id };
  const failed = completeCourseSession({}, context, answers(true, true, true, true, true, true, false, false));
  assert.deepEqual(failed.course.tests[context.id], { passed: false, bestScore: 75, attempts: 1 });
  const passed = completeCourseSession(failed, context, answers(true, true, true, true, true, true, true, false));
  assert.deepEqual(passed.course.tests[context.id], { passed: true, bestScore: 88, attempts: 2 });
  const retaken = completeCourseSession(passed, context, answers(false, false));
  assert.deepEqual(retaken.course.tests[context.id], { passed: true, bestScore: 88, attempts: 3 });
  const exactThreshold = completeCourseSession({}, context, answers(true, true, true, true, false));
  assert.equal(exactThreshold.course.tests[context.id].passed, true);
});

test('empty or malformed sessions do not award course completion', () => {
  const initial = createInitialProgress();
  for (const [context, response] of [
    [{ type: 'lesson', id: 'lesson' }, []],
    [{ type: 'test', id: 'test' }, null],
    [{ type: 'unknown', id: 'lesson' }, answers(true)],
    [{ type: 'lesson', id: '' }, answers(true)],
    [null, answers(true)],
  ]) assert.equal(completeCourseSession(initial, context, response), initial);
  const invalidResponses = completeCourseSession(initial, { type: 'lesson', id: 'lesson' }, [null, {}, { correct: 'yes' }]);
  assert.equal(invalidResponses.course.lessons.lesson.completed, false);
});

test('level test unlocks only when all of that level’s lessons are completed', () => {
  let progress = {};
  assert.equal(canTakeLevelTest(progress, levels[0]), false);
  for (const lesson of levels[0].lessons.slice(0, -1)) {
    progress = completeCourseSession(progress, { type: 'lesson', id: lesson.id }, answers(true));
  }
  assert.equal(canTakeLevelTest(progress, levels[0]), false);
  const lastLesson = levels[0].lessons.at(-1);
  progress = completeCourseSession(progress, { type: 'lesson', id: lastLesson.id }, answers(true));
  assert.equal(canTakeLevelTest(progress, levels[0]), true);
  assert.equal(canTakeLevelTest(progress, levels[1]), false);
  assert.equal(canTakeLevelTest(progress, { lessons: [] }), false);
});

test('lesson access is independent of previous level tests', () => {
  const lesson = levels[5].lessons[0];
  const progress = completeCourseSession({}, { type: 'lesson', id: lesson.id }, answers(true, true, true, true));
  assert.equal(progress.course.lessons[lesson.id].completed, true);
  assert.equal(getCourseProgress(progress, levels).passedTests, 0);
});

test('level tests sample eight unique questions round-robin across lessons', () => {
  const selected = buildLevelTest(levels[0], questions);
  assert.equal(selected.length, 8);
  assert.equal(new Set(selected.map(question => question.id)).size, 8);
  for (const lesson of levels[0].lessons) assert.equal(selected.filter(question => question.lessonId === lesson.id).length, 2);
  assert.deepEqual(selected.slice(0, 4).map(question => question.lessonId), levels[0].lessons.map(lesson => lesson.id));
  const fiveLessonSelection = buildLevelTest(levels[5], questions);
  assert.equal(fiveLessonSelection.length, 8);
  assert.equal(new Set(fiveLessonSelection.map(question => question.lessonId)).size, 5);
});

test('test builder handles small, empty, and duplicated question pools safely', () => {
  const small = questions.slice(0, 3);
  assert.equal(buildLevelTest(levels[0], small).length, 3);
  assert.equal(buildLevelTest(levels[0], [...small, ...small]).length, 3);
  assert.deepEqual(buildLevelTest(levels[0], []), []);
  assert.deepEqual(buildLevelTest(null, questions), []);
});

test('course progress reaches 100% only after all 25 lessons and six tests', () => {
  let progress = {};
  for (const level of levels) {
    for (const lesson of level.lessons) progress = completeCourseSession(progress, { type: 'lesson', id: lesson.id }, answers(true));
  }
  assert.equal(getCourseProgress(progress, levels).percent, 81);
  for (const level of levels) progress = completeCourseSession(progress, { type: 'test', id: level.id }, answers(true));
  assert.deepEqual(getCourseProgress(progress, levels), {
    completedLessons: 25, passedTests: 6, totalLessons: 25, totalTests: 6, percent: 100,
  });
  const unrelated = completeCourseSession(progress, { type: 'lesson', id: 'retired-lesson' }, answers(true));
  assert.equal(getCourseProgress(unrelated, levels).completedLessons, 25);
});

test('course milestones persist alongside playground XP and saved lessons', () => {
  const initial = { ...createInitialProgress(), xp: 40, attempts: 2, correct: 2, saved: ['type-kerning'] };
  const lesson = levels[0].lessons[0];
  const completed = completeCourseSession(initial, { type: 'lesson', id: lesson.id }, answers(true, true, true, false));
  const restored = loadProgress({ getItem: () => JSON.stringify(completed) });
  assert.deepEqual(restored.course, completed.course);
  assert.equal(restored.xp, 40);
  assert.deepEqual(restored.saved, ['type-kerning']);
  assert.equal(getCourseProgress(restored, levels).completedLessons, 1);
});

test('malformed stored course numbers are normalized before recording a retake', () => {
  const progress = { course: { lessons: { damaged: { completed: 'yes', bestScore: Infinity, attempts: -1 } }, tests: [] } };
  const updated = completeCourseSession(progress, { type: 'lesson', id: 'damaged' }, answers(true, false, false, false));
  assert.deepEqual(updated.course.lessons.damaged, { completed: false, bestScore: 25, attempts: 1 });
  assert.deepEqual(updated.course.tests, {});
  assert.equal(getCourseProgress({ course: null }, levels).percent, 0);
});

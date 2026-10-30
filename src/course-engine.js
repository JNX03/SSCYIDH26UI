const objectMap = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const courseState = progress => {
  const course = objectMap(progress?.course);
  return { lessons: objectMap(course.lessons), tests: objectMap(course.tests) };
};
const safeAttempts = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const safeScore = value => Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;

export function getCourseProgress(progress, courseLevels) {
  const levels = Array.isArray(courseLevels) ? courseLevels : [];
  const lessons = levels.flatMap(level => Array.isArray(level.lessons) ? level.lessons : []);
  const course = courseState(progress);
  const completedLessons = lessons.filter(lesson => course.lessons[lesson.id]?.completed === true).length;
  const passedTests = levels.filter(level => course.tests[level.id]?.passed === true).length;
  const totalLessons = lessons.length;
  const totalTests = levels.length;
  const total = totalLessons + totalTests;
  return { completedLessons, passedTests, totalLessons, totalTests, percent: total ? Math.round((completedLessons + passedTests) / total * 100) : 0 };
}

export function completeCourseSession(progress, context, answers) {
  if (!Array.isArray(answers) || answers.length === 0 || !context || !['lesson', 'test'].includes(context.type) || typeof context.id !== 'string' || !context.id.trim()) return progress;
  const course = courseState(progress);
  const isLesson = context.type === 'lesson';
  const collection = isLesson ? 'lessons' : 'tests';
  const passedField = isLesson ? 'completed' : 'passed';
  const previous = objectMap(course[collection][context.id]);
  const score = Math.round(answers.filter(answer => answer?.correct === true).length / answers.length * 100);
  const result = {
    [passedField]: previous[passedField] === true || score >= (isLesson ? 75 : 80),
    bestScore: Math.max(safeScore(previous.bestScore), score),
    attempts: safeAttempts(previous.attempts) + 1,
  };
  return {
    ...progress,
    course: { ...course, [collection]: { ...course[collection], [context.id]: result } },
  };
}

export function canTakeLevelTest(progress, level) {
  const lessons = Array.isArray(level?.lessons) ? level.lessons : [];
  const course = courseState(progress);
  return lessons.length > 0 && lessons.every(lesson => course.lessons[lesson.id]?.completed === true);
}

export function buildLevelTest(level, courseChallenges) {
  const lessons = Array.isArray(level?.lessons) ? level.lessons : [];
  const questions = Array.isArray(courseChallenges) ? courseChallenges : [];
  const groups = lessons.map(lesson => questions.filter(question => question.lessonId === lesson.id));
  const rounds = Math.max(0, ...groups.map(group => group.length));
  const selected = [];
  const seen = new Set();
  for (let round = 0; round < rounds && selected.length < 8; round += 1) {
    for (const group of groups) {
      const question = group[round];
      if (!question || typeof question.id !== 'string' || seen.has(question.id)) continue;
      selected.push(question);
      seen.add(question.id);
      if (selected.length === 8) break;
    }
  }
  return selected;
}

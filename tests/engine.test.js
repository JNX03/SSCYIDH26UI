import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newSession,
  answerQuestion,
  nextQuestion,
  createInitialProgress,
  recordAnswer,
  toggleSaved,
  getDailyCount,
  loadProgress,
} from '../src/engine.js';

// Keep engine regressions independent from lesson copy and illustration changes.
const topics = Array.from({ length: 8 }, (_, index) => ({ id: `topic-${index}` }));
const challenges = topics.flatMap(topic => Array.from({ length: 8 }, (_, index) => ({
  id: `${topic.id}-${index}`,
  topic: topic.id,
  correct: index % 2,
})));

test('mixed practice is bounded to ten unique questions', () => {
  const session = newSession(challenges);
  assert.equal(session.questions.length, 10);
  assert.equal(new Set(session.questions.map(question => question.id)).size, 10);
  assert.equal(session.index, 0);
  assert.deepEqual(session.answers, []);
  assert.equal(session.complete, false);
});

test('seven rotating mixed sessions expose the entire 64-question catalog', () => {
  const sessions=Array.from({length:7},(_,index)=>newSession(challenges,'all',index*10));
  const seen=new Set(sessions.flatMap(session=>session.questions.map(question=>question.id)));
  assert.equal(seen.size, 64);
  assert.equal(sessions[0].questions[0].id, challenges[0].id);
  for(const session of sessions) assert.equal(new Set(session.questions.map(question=>question.id)).size,10);
  assert.equal(newSession(challenges,'all',64).questions[0].id,challenges[0].id);
});

test('mixed sessions include uneven topic sizes and normalize offsets safely', () => {
  const largerTopic=Array.from({length:12},(_,index)=>({id:`extra-${index}`,topic:'large',correct:0}));
  const catalog=[...largerTopic,{id:'small-0',topic:'small',correct:1}];
  const seen=new Set([0,10].flatMap(offset=>newSession(catalog,'all',offset).questions.map(question=>question.id)));
  assert.equal(seen.size,13);
  for(const offset of [undefined,NaN,Infinity,'invalid']) {
    assert.equal(newSession(challenges,'all',offset).questions[0].id,challenges[0].id);
  }
  assert.equal(newSession(largerTopic,'large',-1).questions[0].id,'extra-11');
});

test('topic practice only includes the selected topic and fits smaller catalogs', () => {
  for (const topic of topics) {
    const session = newSession(challenges, topic.id);
    assert.equal(session.questions.length, 8, topic.id);
    assert.ok(session.questions.every(question => question.topic === topic.id), topic.id);
  }
  assert.equal(newSession(challenges.slice(0, 3)).questions.length, 3);
});

test('an empty or unavailable topic completes safely without an answerable question', () => {
  for (const session of [newSession([]), newSession(challenges, 'missing-topic')]) {
    assert.equal(session.complete, true);
    assert.deepEqual(session.questions, []);
    assert.equal(answerQuestion(session, 0), session);
    assert.equal(nextQuestion(session), session);
  }
});

test('answers award points once and do not mutate the previous session', () => {
  const session = newSession(challenges);
  const original = structuredClone(session);
  const question = session.questions[0];
  const answered = answerQuestion(session, question.correct);

  assert.deepEqual(session, original);
  assert.notEqual(answered, session);
  assert.equal(answered.answers.length, 1);
  assert.deepEqual(answered.answers[0], {
    id: question.id,
    choice: question.correct,
    correct: true,
    xp: 20,
  });
  assert.equal(answerQuestion(answered, 1 - question.correct), answered);
  assert.equal(answerQuestion(session, -1), session);
  assert.equal(answerQuestion(session, 2), session);
  assert.equal(answerQuestion(session, undefined), session);
});

test('incorrect answers record feedback and still grant practice points', () => {
  const session = newSession(challenges);
  const answered = answerQuestion(session, 1 - session.questions[0].correct);
  assert.equal(answered.answers[0].correct, false);
  assert.equal(answered.answers[0].xp, 5);
});

test('continue requires an answer and a completed session keeps the final index valid', () => {
  let session = newSession(challenges);
  assert.equal(nextQuestion(session), session);
  for (let index = 0; index < session.questions.length; index += 1) {
    assert.equal(session.index, index);
    session = answerQuestion(session, session.questions[index].correct);
    session = nextQuestion(session);
  }
  assert.equal(session.complete, true);
  assert.equal(session.answers.length, 10);
  assert.ok(session.index < session.questions.length);
  assert.equal(answerQuestion(session, 0), session);
});

test('progress records truthful accuracy, XP, and per-day practice without mutating input', () => {
  const initial = createInitialProgress();
  const original = structuredClone(initial);
  const first = recordAnswer(initial, challenges[0], true, '2026-10-30');
  const second = recordAnswer(first, challenges[1], false, '2026-10-30');
  const third = recordAnswer(second, challenges[2], true, '2026-10-31');

  assert.deepEqual(initial, original);
  assert.equal(third.xp, 45);
  assert.equal(third.attempts, 3);
  assert.equal(third.correct, 2);
  assert.equal(third.history.length, 3);
  assert.deepEqual(third.topicStats[challenges[0].topic], { attempts: 3, correct: 2 });
  assert.equal(third.xp, third.history.reduce((total, item) => total + item.xp, 0));
  assert.equal(getDailyCount(third, '2026-10-30'), 2);
  assert.equal(getDailyCount(third, '2026-10-31'), 1);
  assert.equal(getDailyCount(third, '2026-11-01'), 0);
});

test('streak increases on consecutive days, stays stable within a day, and resets after a gap', () => {
  const first = recordAnswer(createInitialProgress(), challenges[0], true, '2026-10-30');
  const sameDay = recordAnswer(first, challenges[1], true, '2026-10-30');
  const nextDay = recordAnswer(sameDay, challenges[2], true, '2026-10-31');
  const nextMonth = recordAnswer(nextDay, challenges[3], false, '2026-11-01');
  const gap = recordAnswer(nextMonth, challenges[4], true, '2026-11-03');
  assert.equal(first.streak, 1);
  assert.equal(sameDay.streak, 1);
  assert.equal(nextDay.streak, 2);
  assert.equal(nextMonth.streak, 3);
  assert.equal(gap.streak, 1);
});

test('saved lessons toggle independently and preserve other progress', () => {
  const initial = recordAnswer(createInitialProgress(), challenges[0], true, '2026-10-30');
  const once = toggleSaved(initial, challenges[0].id);
  const twice = toggleSaved(once, challenges[1].id);
  const removed = toggleSaved(twice, challenges[0].id);
  assert.deepEqual(initial.saved, []);
  assert.deepEqual(once.saved, [challenges[0].id]);
  assert.deepEqual(removed.saved, [challenges[1].id]);
  assert.equal(removed.xp, initial.xp);
  assert.equal(removed.attempts, initial.attempts);
});

test('storage loads saved progress and recovers from missing or corrupt JSON', () => {
  const progress = toggleSaved(recordAnswer(createInitialProgress(), challenges[0], true, '2026-10-30'), challenges[0].id);
  const storage = { getItem: key => key === 'design-gym-progress-v1' ? JSON.stringify(progress) : null };
  assert.deepEqual(loadProgress(storage), progress);
  assert.deepEqual(loadProgress({ getItem: () => null }), createInitialProgress());
  assert.deepEqual(loadProgress({ getItem: () => '{broken' }), createInitialProgress());
  assert.deepEqual(loadProgress({ getItem: () => 'null' }), createInitialProgress());
  assert.deepEqual(loadProgress({ getItem: () => { throw new Error('storage blocked'); } }), createInitialProgress());
});

test('storage normalizes malformed optional counters, records, saved IDs, and topic statistics', () => {
  const base=recordAnswer(createInitialProgress(),challenges[0],true,'2026-10-30');
  const corrupted={...base,
    streak:'many',completedSessions:-1,
    history:[...base.history,null,{id:'broken',topic:'topic-0',correct:true,date:'2026-02-30',xp:20},{id:'bad-xp',topic:'topic-0',correct:false,date:'2026-10-30',xp:'5'}],
    saved:['lesson-1','lesson-1',null,42,''],
    topicStats:{good:{attempts:3,correct:2},clamped:{attempts:1,correct:99},invalidCorrect:{attempts:2,correct:'two'},broken:{attempts:'three',correct:1}},
  };
  const loaded=loadProgress({getItem:()=>JSON.stringify(corrupted)});
  assert.equal(loaded.streak,0);
  assert.equal(loaded.completedSessions,0);
  assert.deepEqual(loaded.history,base.history);
  assert.deepEqual(loaded.saved,['lesson-1']);
  assert.deepEqual(loaded.topicStats,{good:{attempts:3,correct:2},clamped:{attempts:1,correct:1},invalidCorrect:{attempts:2,correct:0}});
  assert.ok(Number.isFinite(recordAnswer(loaded,challenges[1],true,'2026-10-31').streak));

  const missingDate=loadProgress({getItem:()=>JSON.stringify({...base,lastDate:'not-a-date',streak:4,topicStats:null})});
  assert.equal(missingDate.lastDate,null);
  assert.equal(missingDate.streak,0);
  assert.deepEqual(missingDate.topicStats,{});
});

test('storage rejects invalid core counters instead of producing broken totals', () => {
  const base=createInitialProgress();
  for(const counters of [{xp:-1},{xp:'20'},{attempts:1.5},{attempts:1,correct:2}]) {
    assert.deepEqual(loadProgress({getItem:()=>JSON.stringify({...base,...counters})}),base);
  }
});

test('storage retains only well-formed course milestone records', () => {
  const raw={...createInitialProgress(),course:{
    lessons:{
      passed:{completed:true,bestScore:75,attempts:2,untrustedMarkup:'<img src=x>'},
      failed:{completed:false,bestScore:50,attempts:1},
      badScore:{completed:true,bestScore:'<img src=x onerror=alert(1)>',attempts:1},
      outOfRange:{completed:true,bestScore:101,attempts:1},
      negative:{completed:false,bestScore:-1,attempts:1},
      badFlag:{completed:'true',bestScore:100,attempts:1},
      badAttempts:{completed:true,bestScore:100,attempts:1.5},
      notARecord:null,
    },
    tests:{
      passed:{passed:true,bestScore:88,attempts:3},
      failed:{passed:false,bestScore:75,attempts:1},
      unsafe:{passed:true,bestScore:null,attempts:-1},
    },
  }};
  const loaded=loadProgress({getItem:()=>JSON.stringify(raw)});
  assert.deepEqual(loaded.course,{
    lessons:{passed:{completed:true,bestScore:75,attempts:2},failed:{completed:false,bestScore:50,attempts:1}},
    tests:{passed:{passed:true,bestScore:88,attempts:3},failed:{passed:false,bestScore:75,attempts:1}},
  });
  for(const course of [undefined,null,[],{lessons:[],tests:'invalid'}]) {
    const restored=loadProgress({getItem:()=>JSON.stringify({...createInitialProgress(),course})});
    assert.deepEqual(restored.course,{lessons:{},tests:{}});
  }
});

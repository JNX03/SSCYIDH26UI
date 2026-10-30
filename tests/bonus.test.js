import test from 'node:test';
import assert from 'node:assert/strict';
import {bonusChallenges} from '../src/bonus.js';
import {challenges} from '../src/challenges.js';
import {courseChallenges} from '../src/course.js';
import {designChallenges} from '../src/design-challenges.js';
import {renderVisual} from '../src/visuals.js';

test('the complete game contains 191 unique exercises with visual color relationships',()=>{
 const all=[...bonusChallenges,...challenges,...courseChallenges,...designChallenges];
 assert.equal(all.length,191);
 assert.equal(new Set(all.map(q=>q.id)).size,191);
 for(const q of bonusChallenges){assert.equal(q.options[q.correct].variant,'good');assert.ok(q.explanation.includes('RYB')||q.explanation.includes('color wheel'));}
});
test('the RYB tertiary example highlights six intermediates rather than three primaries',()=>{
 const q=bonusChallenges[0];
 const wrong=renderVisual(q,0),correct=renderVisual(q,1);
 assert.equal((wrong.match(/<circle /g)||[]).length,3);
 assert.equal((correct.match(/<circle /g)||[]).length,6);
 assert.equal((correct.match(/ A108 /g)||[]).length,12);
 assert.match(correct,/TRADITIONAL RYB COLOR WHEEL/);
});
test('color relationship choices remain distinct without nested controls',()=>{
 for(const q of bonusChallenges){const a=renderVisual(q,0),b=renderVisual(q,1);assert.notEqual(a,b);assert.doesNotMatch(a+b,/<(?:button|input|a|select)\b/);assert.doesNotMatch(a+b,/undefined|NaN/);}
});

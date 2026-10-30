import test from 'node:test';
import assert from 'node:assert/strict';
import {insightThai} from '../src/locales/insights.th.js';
import {getAnswerInsight,describeAnswerVisual} from '../src/answer-insights.js';
import {challenges} from '../src/challenges.js';
import {bonusChallenges} from '../src/bonus.js';
import {designChallenges} from '../src/design-challenges.js';
import {courseChallenges} from '../src/course.js';
const all=[...challenges,...bonusChallenges,...designChallenges,...courseChallenges];

test('Thai answer insights cover labels, misconceptions, and focused tips for all 191 questions',()=>{
 for(const q of all){const insight=getAnswerInsight(q);for(const field of ['label','wrongLabel','tip']){const translation=insightThai[insight[field]];assert.equal(typeof translation,'string',`${q.id}:${field}`);assert.match(translation,/[ก-๙]/,`${q.id}:${field}`);assert.notEqual(translation,insight[field]);}assert.match(insightThai[`What to spot: ${insight.label}`],/^สังเกต:/);}
});

test('dynamic color-wheel insight sentences name the actual marked hues in Thai',()=>{
 const complement=designChallenges.find(q=>q.id==='design-color-complement');assert.match(insightThai[getAnswerInsight(complement).tip],/แดง เขียว/);
 const intermediate=designChallenges.find(q=>q.id==='design-color-tertiary');assert.match(insightThai[getAnswerInsight(intermediate).tip],/แดงส้ม เหลืองส้ม เหลืองเขียว น้ำเงินเขียว น้ำเงินม่วง แดงม่วง/);
 const tertiary=bonusChallenges.find(q=>q.visual==='colorwheel'&&q.wheel==='tertiary');assert.match(insightThai[getAnswerInsight(tertiary).tip],/ทั้งหก/);
});

test('all neutral visual descriptions and course-scenario accessible names have Thai translations',()=>{
 for(const q of all)for(const index of [0,1])assert.match(insightThai[describeAnswerVisual(q,index,false)],/[ก-๙]/,`${q.id}:${index}`);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {challenges} from '../src/challenges.js';
import {bonusChallenges} from '../src/bonus.js';
import {designChallenges} from '../src/design-challenges.js';
import {courseChallenges} from '../src/course.js';
import {renderVisual} from '../src/visuals.js';
import {renderAnnotatedVisual,describeAnswerVisual,renderVisualComparisonTip} from '../src/answer-insights.js';
const all=[...challenges,...bonusChallenges,...designChallenges,...courseChallenges];

test('question-stage images remain unchanged and do not announce which answer is correct',()=>{
  for(const q of all)for(const index of [0,1])assert.equal(renderAnnotatedVisual(q,index,false),renderVisual(q,index));
  const kerning=challenges.find(q=>q.visual==='kerning');
  assert.equal(describeAnswerVisual(kerning,0),describeAnswerVisual(kerning,1));
  assert.doesNotMatch(describeAnswerVisual(kerning,1),/correct|better|right answer|wrong/i);
});

test('kerning reveal marks the actual single gap while the alternative marks all six gaps',()=>{
  const q=challenges.find(q=>q.visual==='kerning');const correct=renderAnnotatedVisual(q,q.correct,true);const alternative=renderAnnotatedVisual(q,1-q.correct,true);
  assert.match(correct,/data-ai-targets="1"/);assert.match(alternative,/data-ai-targets="6"/);
  assert.match(correct,/<i class="[^"]*ai-focus-letter-pair[^"]*"[^>]*data-ai-feature="letter-pair"/);
  assert.match(correct,/vg-kerning vg-pair/);assert.match(alternative,/vg-all-gaps/);
  assert.match(renderVisualComparisonTip(q),/n–i gap/);
});

test('color-wheel reveal outlines the selected SVG hue markers, preserving their coordinates',()=>{
  const q=designChallenges.find(q=>q.id==='design-color-complement');const correct=renderAnnotatedVisual(q,q.correct,true);
  assert.match(correct,/data-ai-targets="2"/);
  const circles=[...correct.matchAll(/<circle[^>]*class="[^"]*ai-focus-wheel-hues[^>]*>/g)];assert.equal(circles.length,2);
  for(const circle of circles){assert.match(circle[0],/cx="[\d.-]+"/);assert.match(circle[0],/cy="[\d.-]+"/);assert.match(circle[0],/r="5"/);}
  assert.match(correct,/ai-svg-feature-number/);assert.match(renderVisualComparisonTip(q),/red, green/);
  const tertiary=bonusChallenges.find(q=>q.visual==='colorwheel'&&q.wheel==='tertiary');assert.match(renderAnnotatedVisual(tertiary,tertiary.correct,true),/data-ai-targets="6"/);
});

test('cart reveal marks subtotal and shipping rows rather than highlighting the whole card',()=>{
  const q=challenges.find(q=>q.visual==='cart');const html=renderAnnotatedVisual(q,q.correct,true);
  const rows=[...html.matchAll(/<div class="vg-price-row ai-feature-focus[^>]*>(.*?)<\/div>/g)];assert.equal(rows.length,2);
  assert.match(rows[0][1],/Subtotal/);assert.match(rows[1][1],/Shipping/);
  assert.doesNotMatch(html,/<div class="vg-app[^"]*ai-feature-focus/);
  assert.match(renderAnnotatedVisual(q,1-q.correct,true),/vg-price-row vg-total ai-feature-focus/);
});

test('form reveal locates persistent labels and actionable error text in their own fields',()=>{
  const labels=challenges.find(q=>q.id==='a11y-labels');const html=renderAnnotatedVisual(labels,labels.correct,true);
  assert.match(html,/<span class="vg-label ai-feature-focus[^>]*data-ai-feature="persistent-label"[^>]*>Email address<\/span>/);
  const error=challenges.find(q=>q.visual==='error');const errorHtml=renderAnnotatedVisual(error,error.correct,true);
  assert.match(errorHtml,/<span class="vg-error-text ai-feature-focus[^>]*>Add a domain, like alex@studio.co\.<\/span>/);
});

test('every revealed example has a real feature target and a nonempty focused explanation',()=>{
  for(const q of all){assert.match(renderVisualComparisonTip(q),/<strong>What to spot: .+<\/strong><p>.+<\/p>/);for(const index of [0,1]){const html=renderAnnotatedVisual(q,index,true);assert.doesNotMatch(html,/data-ai-targets="0"|undefined|NaN/);assert.match(html,/data-ai-feature="[a-z-]+"/);assert.doesNotMatch(html,/<(?:button|input|select|textarea|a)\b/);}}
});

test('wheel teaching pointers focus on the differing hue instead of a shared marker',()=>{
 const q=designChallenges.find(q=>q.id==='design-color-tetradic');
 for(const index of [q.correct,1-q.correct]){
  const marks=q.options[index].marks,other=q.options[1-index].marks;
  const differing=marks.find(hue=>!other.includes(hue));
  const angle=(differing*30-90)*Math.PI/180;
  const expectedX=110+65*Math.cos(angle),expectedY=110+65*Math.sin(angle);
  const html=renderAnnotatedVisual(q,index,true);
  const primary=html.match(/<circle[^>]*data-ai-primary="true"[^>]*>/)?.[0];
  assert.ok(primary);assert.ok(Math.abs(Number(primary.match(/cx="([^"]+)"/)[1])-expectedX)<.01);assert.ok(Math.abs(Number(primary.match(/cy="([^"]+)"/)[1])-expectedY)<.01);
 }
});
